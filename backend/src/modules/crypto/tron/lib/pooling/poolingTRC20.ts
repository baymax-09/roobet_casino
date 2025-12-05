import type TronWeb from 'tronweb'

import { config } from 'src/system/config'
import { convertCurrencyToUserBalance } from 'src/modules/currency'

import {
  type TronBalance,
  deleteWalletBalanceById,
  updateWalletBalance,
  getUnprocessedBalancesByToken,
} from '../../documents/tron_balances'
import { getTronWallet } from '../../documents/tron_wallets'
import { publishTronPoolingMessage } from '../../rabbitmq'
import { type TronAddressBase58, type TRC20Token } from '../../types'
import { getProvider } from '../../util/getProvider'
import { estimateTronEnergy } from '../fees'
import {
  derivePoolingWallet,
  getTRC20Allowance,
  getTRC20Balance,
  getTrxBalance,
} from '../wallet'
import {
  buildFundingMessage,
  buildApprovalMessage,
} from './buildTransactionMessage'
import { tronPoolingLogger, shouldPoolWallet } from './poolingMain'

const poolingWalletThreshold = config.tron.pooling.poolingThreshold
const fundBufferMultiplier = config.tron.pooling.fundBufferMultiplier

export async function getTRC20PoolingThreshold(token: TRC20Token) {
  const fee = await estimateTronEnergy(token)
  return {
    ...fee,
    usd: fee.usd * fundBufferMultiplier,
  }
}

export async function shouldPoolTRC20(token: TRC20Token): Promise<boolean> {
  const { address } = derivePoolingWallet()
  const index = config.tron.pooling.poolingIndex
  const balance = await getTRC20Balance(address, index, token)
  const balanceInUSD = await convertCurrencyToUserBalance(balance, token)

  return balanceInUSD < poolingWalletThreshold
}

export const shouldApproveWallet = async (
  address: TronAddressBase58,
  index: number,
  token: TRC20Token,
) => {
  const balance = await getTRC20Balance(address, index, token)
  const spender = derivePoolingWallet().address
  const approvalAmount = await getTRC20Allowance(address, spender, index, token)

  return approvalAmount < balance
}

export const shouldFundWallet = async (
  address: TronAddressBase58,
  token: TRC20Token,
) => {
  const { trx } = await getTrxBalance(address)
  const result = await estimateTronEnergy(token)
  const energyNeededForApproval = result.trx
  const amountToFund = energyNeededForApproval * 1.25

  return {
    shouldFund: trx <= amountToFund,
    amountInTrx: amountToFund,
  }
}

async function poolTRC20FromWallet(
  tronweb: TronWeb,
  poolingWalletAddress: TronAddressBase58,
  balanceDoc: TronBalance,
  token: TRC20Token,
) {
  const logger = tronPoolingLogger('poolTRC20', { userId: null })

  const wallet = await getTronWallet(balanceDoc.address)
  if (!wallet) {
    logger.error('no user wallet found for this balance record', {
      balanceDoc,
    })
    return
  }

  // Does this wallet even have any tokens?
  const { shouldPool, shouldDeleteBalanceDoc, balance } =
    await shouldPoolWallet(wallet.address, wallet.nonce, token)
  if (!shouldPool) {
    logger.info(
      `Balance below threshold for wallet ${balanceDoc._id.toString()}`,
      {
        balanceDoc,
        token,
      },
    )

    if (balance !== undefined && shouldDeleteBalanceDoc) {
      await deleteWalletBalanceById(balanceDoc._id)
    }
    return
  }

  // if pooling wallet already has authority to transfer tokens for this wallet,
  // then just pool the tokens
  const shouldApprove = await shouldApproveWallet(
    wallet.address,
    wallet.nonce,
    token,
  )
  if (shouldApprove) {
    // Decide whether to fund the users wallet to cover the fee costs. If so, then also return how much to cover
    const { shouldFund, amountInTrx } = await shouldFundWallet(
      wallet.address,
      token,
    )
    const amountToFund = await convertCurrencyToUserBalance(amountInTrx, 'trx')

    if (shouldFund && amountInTrx) {
      const fundMessage = await buildFundingMessage({
        token,
        userWalletAddress: wallet.address,
        poolingWalletAddress,
        amountInSun: parseInt(tronweb.toSun(amountInTrx)),
        amountInUSD: amountToFund,
      })
      // Sending user the amount specified above to cover costs of gas
      await updateWalletBalance(wallet._id, 'fund', true)
      await publishTronPoolingMessage(fundMessage)

      logger.info(`Funding wallet ${wallet.address} with ${amountInTrx} ztrx`, {
        wallet,
        amountInTrx,
        token,
      })
      return
    }

    const approvalMessage = buildApprovalMessage({
      token,
      userWallet: {
        ...wallet,
        id: wallet._id.toString(),
        type: 'Tron',
      },
      walletToApprove: poolingWalletAddress,
    })
    await updateWalletBalance(wallet._id, 'approve', true)
    await publishTronPoolingMessage(approvalMessage)

    logger.info(`Approving ${token} transfers from ${wallet.address}`, {
      wallet,
      token,
    })
  }
}

export async function poolTRC20(token: TRC20Token) {
  const logger = tronPoolingLogger('poolTRC20', { userId: null })
  const tronweb = getProvider()
  const poolingWalletAddress = derivePoolingWallet().address

  const balanceDocs = await getUnprocessedBalancesByToken(token)
  for (const [index, balanceDoc] of balanceDocs.entries()) {
    logger.info(`wallet ${index + 1} funding ${token}`, {
      address: balanceDoc.address,
    })
    await poolTRC20FromWallet(tronweb, poolingWalletAddress, balanceDoc, token)
  }
}
