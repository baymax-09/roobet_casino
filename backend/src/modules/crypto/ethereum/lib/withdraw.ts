import { toBN, toWei } from 'web3-utils'
import Web3 from 'web3'

import { config } from 'src/system'
import { type Types as UserTypes } from 'src/modules/user'
import { type Types as WithdrawalTypes } from 'src/modules/withdraw'
import { getERC20Config } from 'src/modules/crypto/ethereum/lib'
import { type Currency } from 'src/modules/currency/types'
import { erc20WithdrawalPluginTokenMap } from 'src/modules/withdraw/lib/plugins'
import {
  convertUserBalanceToEther,
  derivePrimaryEthWalletAddress,
  estimateERC20Fee,
  estimateEthereumFee,
  isSmartContract,
} from 'src/modules/crypto/ethereum'
import { convertUserBalanceToCurrency } from 'src/modules/currency'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'
import { type User } from 'src/modules/user/types'
import { APIValidationError } from 'src/util/errors'
import { BasicCache } from 'src/util/redisModels'

import {
  type ETHToken,
  Process,
  QueuePriority,
  isERC20LowercaseName,
  isERC20Token,
  type EthereumCryptoProperNameLowercase,
} from '../types'
import { erc20ABI } from './abi/erc20'
import { publishSendEthereumTransactionEvent } from '../rabbitmq'
import { cryptoLogger } from '../../lib/logger'
import { type IOResult } from '../../types'
import { getEthereumWallet } from '../../lib/wallet'

interface ValidationResponse {
  fee: number
  checksumAddress: string
}

const { WITHDRAW_PRIORITY } = QueuePriority

const PluginToToken: Record<EthereumCryptoProperNameLowercase, ETHToken> = {
  ethereum: 'eth',
  tether: 'usdt',
  usdc: 'usdc',
}

export async function validateWithdraw(
  user: User,
  destinationAddress: string,
  amount: number,
  plugin: EthereumCryptoProperNameLowercase,
): Promise<IOResult<ValidationResponse, APIValidationError>> {
  const token = PluginToToken[plugin]
  const checksumAddress = Web3.utils.toChecksumAddress(destinationAddress)
  const validAddress = Web3.utils.isAddress(destinationAddress)
  if (!validAddress) {
    return {
      success: false,
      result: undefined,
      error: new APIValidationError('withdrawal__invalid_address'),
    }
  }

  if (!checksumAddress.length) {
    return {
      success: false,
      result: undefined,
      error: new APIValidationError('withdrawal__invalid_address'),
    }
  }

  if (await isSmartContract(checksumAddress)) {
    return {
      success: false,
      result: undefined,
      error: new APIValidationError('no__smart_contracts'),
    }
  }

  if (amount < 10) {
    const convertedMin = await exchangeAndFormatCurrency(10, user)
    return {
      success: false,
      result: undefined,
      error: new APIValidationError('withdrawal__min_plugin', [
        `${plugin}`,
        `${convertedMin}`,
      ]),
    }
  }

  const ourWallet = await getEthereumWallet(checksumAddress)
  if (ourWallet) {
    return {
      success: false,
      result: undefined,
      error: new APIValidationError('invalid__withdrawal_self'),
    }
  }

  const feeResult: { fee: number } = await BasicCache.cached(
    `${token}/fee`,
    '',
    30,
    async () =>
      isERC20Token(token)
        ? await estimateERC20Fee(token)
        : estimateEthereumFee(),
  )
  if (feeResult.fee > amount) {
    return {
      success: false,
      result: undefined,
      error: new APIValidationError('withdrawal__fee_greater'),
    }
  }

  if (feeResult.fee === amount) {
    return {
      success: false,
      result: undefined,
      error: new APIValidationError('not_enough_balance'),
    }
  }

  return {
    success: true,
    result: {
      fee: feeResult.fee,
      checksumAddress,
    },
    error: undefined,
  }
}

export async function withdrawEther(
  user: UserTypes.User,
  withdrawal: WithdrawalTypes.CryptoWithdrawal,
): Promise<void> {
  const {
    totalValue: grossWithdrawalAmountUSD,
    fields: { address: recipient, userFeePaid = 0 },
  } = withdrawal.request

  if (!recipient) {
    // FIXME: do we use the stringified information?
    // Can we log the error here and return the withdrawl object instead?
    throw new Error(
      `withdrawERC20 - missing address - ${JSON.stringify(withdrawal)}`,
    )
  }

  const mainWalletAddress = await derivePrimaryEthWalletAddress()
  const amountToConvert = grossWithdrawalAmountUSD - userFeePaid
  const growssWithdrawalAmountEther =
    await convertUserBalanceToEther(amountToConvert)
  const grossWithdrawalAmountWei = toWei(
    growssWithdrawalAmountEther.toFixed(18),
    'ether',
  )
  const { standard: gas } = config.ethereum.gasLimit
  const netWithdrawalAmountWei = toBN(grossWithdrawalAmountWei)

  if (netWithdrawalAmountWei.lte(toBN(0)) || grossWithdrawalAmountUSD < 0) {
    throw new Error('withdrawEther - balance too small to send')
  }

  const userFeePaidETH = await convertUserBalanceToEther(userFeePaid)
  publishSendEthereumTransactionEvent(
    {
      tx: {
        gas,
        to: recipient,
        from: mainWalletAddress,
        value: netWithdrawalAmountWei.toString(),
      },
      token: 'eth',
      process: Process.WITHDRAWAL,
      signer: {
        wallet: 'main',
      },
      sendTo: {
        walletAddress: recipient,
        user,
      },
      fees: {
        userFeePaid: userFeePaidETH,
        userFeePaidUSD: userFeePaid,
      },
      value: grossWithdrawalAmountUSD,
      withdrawal,
    },
    { priority: WITHDRAW_PRIORITY },
  )
}

export async function withdrawERC20(
  user: UserTypes.User,
  withdrawal: WithdrawalTypes.CryptoWithdrawal,
): Promise<void> {
  const {
    totalValue: grossWithdrawalAmountUSD,
    fields: { address: recipient, userFeePaid = 0 },
  } = withdrawal.request

  if (!recipient) {
    // FIXME: do we use the stringified information?
    // Can we log the error here and return the withdrawal object instead?
    throw new Error(
      `withdrawERC20 - missing address - ${JSON.stringify(withdrawal)}`,
    )
  }

  if (!isERC20LowercaseName(withdrawal.plugin)) {
    // FIXME: do we use the stringified information?
    // Can we log the error here and return the withdrawal object instead?
    throw new Error(
      `withdrawERC20 - unsupported plugin - ${JSON.stringify(withdrawal)}`,
    )
  }

  const token = erc20WithdrawalPluginTokenMap[withdrawal.plugin]

  const mainWalletAddress = await derivePrimaryEthWalletAddress()
  const tokenData = getERC20Config(token)

  if (!tokenData) {
    // FIXME: do we use the stringified information?
    // Can we log the error here and return the withdrawal object instead?
    throw new Error(
      `withdrawERC20 - missing token data - ${JSON.stringify(withdrawal)}`,
    )
  }

  const { erc20: gas } = config.ethereum.gasLimit
  const { contractAddress, decimals } = tokenData

  const provider = new Web3.providers.HttpProvider(config.ethereum.httpProvider)
  const web3 = new Web3(provider)

  const netWithdrawalAmountUSD = grossWithdrawalAmountUSD - userFeePaid
  const amountFormattedUnits = await convertUserBalanceToCurrency(
    netWithdrawalAmountUSD,
    token as Currency,
  )

  if (amountFormattedUnits <= 0) {
    // FIXME: do we use the stringified information?
    // Can we log the error here and return the withdrawal object instead?
    throw new Error(
      `withdrawERC20 - balance too small to send - ${JSON.stringify(
        withdrawal,
      )}`,
    )
  }

  const base = toBN(10)
  const exponent = toBN(decimals)
  const factor = base.pow(exponent)
  const amountAtomicUnits = toBN(Math.floor(amountFormattedUnits)).mul(factor)
  const erc20Contract = new web3.eth.Contract(erc20ABI, contractAddress)
  const data = erc20Contract.methods
    .transfer(recipient, amountAtomicUnits.toString())
    .encodeABI()

  provider.disconnect()

  cryptoLogger('ethereum/withdrawERC20', { userId: user.id }).info(
    `withdrawERC20 - sending ${token} transaction to queue - ${netWithdrawalAmountUSD} USD to ${recipient}`,
    { token, netWithdrawalAmountUSD, recipient },
  )

  const userFeePaidETH =
    userFeePaid !== 0
      ? await convertUserBalanceToCurrency(userFeePaid, token as Currency)
      : 0
  publishSendEthereumTransactionEvent(
    {
      tx: {
        data,
        gas,
        from: mainWalletAddress,
        to: contractAddress,
      },
      token,
      process: Process.WITHDRAWAL,
      signer: {
        wallet: 'main',
      },
      sendTo: {
        walletAddress: recipient,
        user,
      },
      fees: {
        userFeePaid: userFeePaidETH,
        userFeePaidUSD: userFeePaid,
      },
      value: grossWithdrawalAmountUSD,
      withdrawal,
    },
    { priority: WITHDRAW_PRIORITY },
  )
}
