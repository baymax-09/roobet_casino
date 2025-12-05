import Web3 from 'web3'
import { toBN, toWei, fromWei } from 'web3-utils'
import { differenceInDays } from 'date-fns'

import { config } from 'src/system'
import { getERC20Config } from 'src/modules/crypto/ethereum/lib'
import {
  convertEtherToUserBalance,
  convertUserBalanceToEther,
  derivePrimaryEthWalletAddress,
  getGasPrice,
} from 'src/modules/crypto/ethereum'
import { BasicCache } from 'src/util/redisModels'

import { erc20ABI } from '../abi/erc20'
import { getERC20Balance, getEthBalance } from '../balance'
import {
  type ERC20Token,
  type ETHToken,
  Process,
  isERC20LowercaseName,
} from '../../types'
import {
  type EthereumBalance,
  getBalancesByAddress,
  updateWalletBalance,
  deleteWalletBalanceById,
} from '../../documents/ethereum_balances'
import { getWalletByAddress } from '../../documents/ethereum_wallets'
import {
  buildERC20PoolingMessage,
  buildFundingMessage,
  buildApprovalMessage,
} from './buildTransactionMessage'
import { publishSendEthereumTransactionEvent } from '../../rabbitmq'
import { cryptoLogger } from '../../../lib/logger'

const { standard, erc20 } = config.ethereum.gasLimit
const MAX_UINT = toBN(
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
)

/**
 * Get an ERC20  token contract instance
 * @param token
 * @returns Contract & HttpProvider
 */
const getERC20TokenContract = async (token: ERC20Token) => {
  const { contractAddress } = getERC20Config(token)
  const provider = new Web3.providers.HttpProvider(config.ethereum.httpProvider)
  const web3 = new Web3(provider)

  return new web3.eth.Contract(erc20ABI, contractAddress)
}

export const updateTokensToPool = async (token: ETHToken) => {
  // "poolEth" will contain an array of all the tokens that need to be pooled.
  const tokens = await BasicCache.get('poolEth', 'poolEth')
  const logger = cryptoLogger('ethereum/updateTokensToPool', { userId: null })

  logger.info(`Insufficient funds in main wallet. Tokens in redis: ${tokens}`, {
    tokens,
    token,
  })
  if (!tokens) {
    logger.info(
      `Insufficient funds in main wallet. Settings new tokens in redis: ${[
        token,
      ]}`,
      { tokens, token },
    )
    await BasicCache.set('poolEth', 'poolEth', [token], 60 * 11)
  } else if (tokens && !tokens.includes(token)) {
    tokens.push(token)
    logger.info(
      `Insufficient funds in main wallet. Settings new tokens in redis: ${tokens}`,
      { tokens, token },
    )
    await BasicCache.set('poolEth', 'poolEth', tokens, 60 * 11)
  }
}

/**
 * This function returns the token allowance for the primary wallet.
 * @param token | ERC20 Token
 * @param owner | address of token owner
 * @returns unformatted balance of token
 */
export const getERC20Allowance = async (token: ERC20Token, owner: string) => {
  const spender = await derivePrimaryEthWalletAddress()
  const contract = await getERC20TokenContract(token)

  // Represents how much we are allowed to withdrawal from the users address
  // Types are bad here, methods: any
  // eslint-disable-next-line @typescript-eslint/return-await
  return await contract.methods.allowance(owner, spender).call()
}

/**
 * Estimate the cost, in wei, to transfer ETH to an EOA
 * @todo BD move this to fees.ts to replace existing estimate
 * @returns gas cost and gas price
 */
export const getEstimateForEthTransfer = async () => {
  const gasPrice = await getGasPrice()
  const gasCostWei = toBN(gasPrice).mul(toBN(standard)).toString()
  const gasCostEther = fromWei(gasCostWei, 'ether')
  const gasCostUSD = await convertEtherToUserBalance(parseFloat(gasCostEther))
  const gasPriceWei = gasPrice.toString()

  return {
    gasCostWei,
    gasCostUSD,
    gasPriceWei,
  }
}

/**
 * Estimate the cost, in wei, to transfer ERC20 to an EOA
 * @todo BD move this to fees.ts to replace existing estimate
 * @returns gas cost and gas price
 */
export const getEstimateForERC20Transfer = async () => {
  const gasPrice = await getGasPrice()
  const gasCostWei = toBN(gasPrice).mul(toBN(erc20)).toString()
  const gasCostUSD = await convertEtherToUserBalance(
    parseFloat(fromWei(gasCostWei, 'ether')),
  )
  const gasPriceWei = gasPrice.toString()

  return {
    gasCostWei,
    gasCostUSD,
    gasPriceWei,
  }
}

/**
 * Get the pooling threshold for a user and token. If the user has not bet in the last 90 days,
 * the threshold is 2x the gas cost to transfer. Otherwise, the threshold is 10x the gas cost to transfer.
 * @param userId | string
 * @param token | ERC20Token | 'eth'
 * @returns object containing the pooling threshold in USD, ETH, and Wei
 */
export const getPoolingThreshold = async (
  wallet: EthereumBalance,
  token: ETHToken,
) => {
  const isActive = differenceInDays(new Date(), new Date(wallet.createdAt)) < 14

  const { gasCostUSD } = await (async (): Promise<{ gasCostUSD: number }> => {
    if (token === 'eth') {
      return await getEstimateForEthTransfer()
    }

    return await getEstimateForERC20Transfer()
  })()

  const poolingThresholdUSD = !isActive ? gasCostUSD * 1.5 : gasCostUSD * 2
  const poolingThresholdETH =
    await convertUserBalanceToEther(poolingThresholdUSD)
  const poolingThresholdWei = toWei(poolingThresholdETH.toFixed(18), 'ether')

  return {
    poolingThresholdUSD,
    poolingThresholdETH,
    poolingThresholdWei,
  }
}

/**
 * Get the gas estimate for an ERC20 approve transaction.
 * @param walletIndex | number
 * @param token | ERC20Token
 */
export const getGasEstimateForApproval = async (
  userWallet: string,
  token: ERC20Token,
) => {
  const contract = await getERC20TokenContract(token)
  const mainWallet = await derivePrimaryEthWalletAddress()
  const gasPrice = await getGasPrice()
  const gasEstimate: string = await contract.methods
    .approve(mainWallet, MAX_UINT)
    .estimateGas({ from: userWallet })
  const gasCost = toBN(gasEstimate).mul(toBN(gasPrice))

  return { gasPrice, gasCost, gasEstimate }
}

/**
 * Returns true if the `token` balance of `wallet` is greater than the pooling threshold.
 * @param wallet | EthereumBalance
 * @param token | ERC20Token
 * @returns boolean
 */
export const shouldPoolWallet = async (
  wallet: EthereumBalance,
  token: ETHToken,
): Promise<{ shouldPool: boolean; balance?: number }> => {
  const { poolingThresholdUSD } = await getPoolingThreshold(wallet, token)
  const provider = new Web3.providers.HttpProvider(config.ethereum.httpProvider)
  const web3 = new Web3(provider)

  if (token === 'eth') {
    // are there any other tokens that need to be pooled from this wallet?
    // If so, then we don't want to pool the ETH from it yet
    const balanceDocs = await getBalancesByAddress(wallet.address)
    const shouldWait = balanceDocs.some(
      doc =>
        isERC20LowercaseName(doc.token) && doc.actionRequired === 'approve',
    )
    if (shouldWait) {
      return {
        shouldPool: false,
      }
    }

    const balance = await web3.eth.getBalance(wallet.address)
    const ethBalance = parseFloat(web3.utils.fromWei(balance, 'ether'))
    const ethBalanceUSD = await convertEtherToUserBalance(ethBalance)

    provider.disconnect()
    return {
      shouldPool: ethBalanceUSD > poolingThresholdUSD,
      balance: ethBalanceUSD,
    }
  }

  const { balanceUSD: erc20BalanceUSD } = await getERC20Balance(
    wallet.address,
    token,
  )
  cryptoLogger('ethereum/shouldPoolWallet', { userId: null }).info(
    `ERC20 Balance: ${erc20BalanceUSD}, USD Pooling Threshold: ${poolingThresholdUSD}, Wallet ID: ${wallet._id.toString()}`,
    {
      erc20BalanceUSD,
      poolingThresholdUSD,
      wallet,
    },
  )
  return {
    shouldPool: erc20BalanceUSD > poolingThresholdUSD,
    balance: erc20BalanceUSD,
  }
}

/**
 * Do we need to approve the main wallet to spend the token on behalf of the user `wallet`?
 * @param wallet | EthereumBalance that might need approval
 * @param token | The token that might need to be approved
 * @returns true if the wallet needs approval, otherwise false
 */
export async function shouldApproveWallet(
  wallet: EthereumBalance,
  token: ERC20Token,
): Promise<boolean> {
  const tokenData = getERC20Config(token)
  const { contractAddress } = tokenData
  const provider = new Web3.providers.HttpProvider(config.ethereum.httpProvider)
  const web3 = new Web3(provider)
  const erc20Contract = new web3.eth.Contract(erc20ABI, contractAddress)
  const erc20Balance: string = await erc20Contract.methods
    .balanceOf(wallet.address)
    .call()
  const allowance: string = await getERC20Allowance(token, wallet.address)

  provider.disconnect()

  return toBN(allowance).lt(toBN(erc20Balance))
}

/**
 * Should we fund the user wallet with some ETH to cover the gas cost of approving the token?
 * If yes, how much ETH should we fund the wallet with?
 * @param wallet
 * @returns { shouldFund: boolean, amount?: string }
 */
export async function shouldFundWallet(
  walletAddress: string,
  token: ERC20Token,
): Promise<{ shouldFund: boolean; amount?: string }> {
  const provider = new Web3.providers.HttpProvider(config.ethereum.httpProvider)
  const web3 = new Web3(provider)
  const balance = await web3.eth.getBalance(walletAddress)
  const { gasCost } = await getGasEstimateForApproval(walletAddress, token)
  const loanAmount = toWei('0.01', 'ether')
  const requiredBalance = gasCost.add(toBN(loanAmount)).toString()

  provider.disconnect()

  if (toBN(balance).lte(toBN(requiredBalance))) {
    return { shouldFund: true, amount: requiredBalance.toString() }
  }

  return { shouldFund: false }
}

/**
 * Returns true if the balance of the primary eth wallet is less than the pooling threshold
 * @returns boolean
 */
export async function shouldPoolEth(): Promise<boolean> {
  const mainAddress = await derivePrimaryEthWalletAddress()
  const { balanceUSD } = await getEthBalance(mainAddress)

  if (balanceUSD < 200_000) {
    cryptoLogger('ethereum/shouldPoolEth', { userId: null }).info(
      `ETH balance is ${balanceUSD} USD`,
      { mainAddress },
    )
    return true
  }

  return false
}

/**
 * Returns true if the balance of the primary eth wallet is less than the pooling threshold
 * @param token ERC20Token
 * @returns boolean
 */
export async function shouldPoolERC20(token: ERC20Token): Promise<boolean> {
  const mainAddress = await derivePrimaryEthWalletAddress()
  const { balanceUSD } = await getERC20Balance(mainAddress, token)

  if (balanceUSD < 200_000) {
    cryptoLogger('ethereum/shouldPoolERC20', { userId: null }).info(
      `${token} balance is (${balanceUSD} USD)`,
      { token, mainAddress },
    )
    return true
  }

  return false
}

/**
 * Sends ERC20 pool transactions to the events exchange queue
 * @param param0 { wallet: EthereumBalance, token: ERC20Token }
 * @returns Promse<boolean> true if eth should be pooled for the wallet in the same event loop
 */
export async function poolERC20({
  wallet,
  token,
}: {
  wallet: EthereumBalance
  token: ERC20Token
}): Promise<void> {
  const logger = cryptoLogger('ethereum/poolERC20', { userId: null })
  const { shouldPool, balance } = await shouldPoolWallet(wallet, token)
  if (!shouldPool) {
    logger.info(`Balance below threshold for wallet ${wallet._id.toString()}`, {
      wallet,
      token,
    })
    if (balance !== undefined && balance <= 0) {
      await deleteWalletBalanceById(wallet._id)
    }
    return
  }

  const mainWallet = await derivePrimaryEthWalletAddress()
  const shouldApprove = await shouldApproveWallet(wallet, token)

  if (shouldApprove) {
    // Decide whether to fund the users wallet to cover the gas costs. If so, then also return how much to cover
    const { shouldFund, amount } = await shouldFundWallet(wallet.address, token)

    if (shouldFund && amount) {
      const fundMessage = buildFundingMessage({
        token,
        userWalletAddress: wallet.address,
        fromWallet: mainWallet,
        amount,
      })
      // Sending user the amount specified above to cover costs of gas
      await updateWalletBalance(wallet._id, 'fund', true)
      await publishSendEthereumTransactionEvent(fundMessage)

      logger.info(`Funding wallet ${wallet.address} with ${amount} ETH`, {
        wallet,
        amount,
        token,
      })
      return
    }

    const userWallet = await getWalletByAddress(wallet.address)

    if (!userWallet) {
      logger.error(`No userWallet found for address ${wallet}`, {
        wallet,
        token,
      })
      return
    }

    const approvalMessage = buildApprovalMessage({
      token,
      userWallet,
      walletToApprove: mainWallet,
    })
    await updateWalletBalance(wallet._id, 'approve', true)
    await publishSendEthereumTransactionEvent(approvalMessage)

    logger.info(`Approving ${token} transfers from ${wallet.address}`, {
      wallet,
      token,
      userWallet,
    })
    return
  }

  const poolingMessage = await buildERC20PoolingMessage({
    token,
    userWalletAddress: wallet.address,
    mainWalletAddress: mainWallet,
  })

  await updateWalletBalance(wallet._id, 'pool', true)
  await publishSendEthereumTransactionEvent(poolingMessage)

  logger.info(`Pooling ${token} from ${wallet.address}`, { token, wallet })
}

/**
 * Sends ETH pooling transactions to the events exchange queue
 * @param param0 { wallet: EthereumBalance }
 * @returns void
 */
export async function poolEth({
  wallet,
}: {
  wallet: EthereumBalance
}): Promise<void> {
  const { standard: gas } = config.ethereum.gasLimit
  const provider = new Web3.providers.HttpProvider(config.ethereum.httpProvider)
  const web3 = new Web3(provider)
  const balance = await web3.eth.getBalance(wallet.address)
  const { gasCostWei } = await getEstimateForEthTransfer()
  const amountAfterFee = toBN(balance).sub(toBN(gasCostWei))
  const mainWallet = await derivePrimaryEthWalletAddress()
  const logger = cryptoLogger('ethereum/poolEth', { userId: null })

  if (amountAfterFee.lte(toBN(0))) {
    logger.info(`Balance too small to send - ${balance}, ${wallet}`, {
      wallet,
      amountAfterFee,
      mainWallet,
    })
    await deleteWalletBalanceById(wallet._id)
    provider.disconnect()
    return
  }

  const tx = {
    from: wallet.address,
    gas,
    to: mainWallet,
    value: amountAfterFee.toString(),
  }

  const userWallet = await getWalletByAddress(wallet.address)

  if (!userWallet) {
    logger.error(`No userWallet found for address ${wallet}`, { wallet })
    return
  }

  provider.disconnect()

  await updateWalletBalance(wallet._id, 'pool', true)
  await publishSendEthereumTransactionEvent({
    tx,
    token: 'eth',
    process: Process.POOLING,
    signer: {
      wallet: 'user',
      walletIndex: userWallet.nonce,
    },
    walletAddress: wallet.address,
  })
}
