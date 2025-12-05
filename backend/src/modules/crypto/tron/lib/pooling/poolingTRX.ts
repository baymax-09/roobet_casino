import { config } from 'src/system/config'

import {
  type TronBalance,
  updateWalletBalance,
  getUnprocessedBalancesByToken,
} from '../../documents/tron_balances'
import { publishTronPoolingMessage } from '../../rabbitmq'
import { getProvider } from '../../util/getProvider'
import { estimateTronBandwidth } from '../fees'
import {
  derivePoolingWallet,
  derivePrimaryWallet,
  getTronWalletByAddress,
  getTrxBalance,
} from '../wallet'
import { buildTrxPoolingMessage } from './buildTransactionMessage'
import { getFreeResources, tronPoolingLogger } from './poolingMain'

const poolingWalletThreshold = config.tron.pooling.poolingThreshold
const fundBufferMultiplier = config.tron.pooling.fundBufferMultiplier

export async function getTrxPoolingThreshold() {
  const fee = await estimateTronBandwidth()
  return {
    ...fee,
    usd: fee.usd * fundBufferMultiplier,
  }
}

export async function shouldPoolTrx(): Promise<boolean> {
  // we should pool if the MAIN wallet is low
  const { address } = derivePrimaryWallet()
  const { usd: balanceUSD } = await getTrxBalance(address)
  return balanceUSD < poolingWalletThreshold
}

async function poolTRXFromWallet(wallet: TronBalance) {
  const logger = tronPoolingLogger('poolTRX', { userId: null })
  const tronweb = getProvider()

  const totalBalance = await getTrxBalance(wallet.address)
  const fee = await estimateTronBandwidth()

  if (totalBalance.trx <= 0) {
    logger.info('no balance in wallet', { wallet })
    return
  }

  if (totalBalance.trx < fee.trx) {
    const { freeBandwidth } = await getFreeResources(wallet.address)
    if (freeBandwidth < fee.bandwidth) {
      logger.info('insufficient balance to cover fee', { wallet })
      return
    }
  }

  const { address } = derivePoolingWallet()
  const balanceInSun = parseInt(tronweb.toSun(totalBalance.trx))
  const tx = await tronweb.transactionBuilder.sendTrx(
    address,
    balanceInSun,
    wallet.address,
    0,
  )
  logger.info('balanceInSun and tx', { tx, balanceInSun })
  const userWallet = await getTronWalletByAddress(wallet.address)
  if (!userWallet) {
    logger.error('User wallet cannot be found for balance record', {
      wallet,
    })
    return
  }

  logger.info('wallet fetched', { userWallet })
  const poolMessage = await buildTrxPoolingMessage({
    poolingWalletAddress: address,
    userWallet,
    amountInSun: balanceInSun,
    amountInUSD: totalBalance.usd,
  })
  await publishTronPoolingMessage(poolMessage)

  await updateWalletBalance(wallet._id, 'pool', true)
}

export async function poolTRX() {
  const logger = tronPoolingLogger('poolTRX', { userId: null })

  const walletsToPool = await getUnprocessedBalancesByToken('trx')
  for (const [index, wallet] of walletsToPool.entries()) {
    logger.info(`wallet ${index + 1} pooling trx`, { address: wallet.address })
    await poolTRXFromWallet(wallet)
  }
}
