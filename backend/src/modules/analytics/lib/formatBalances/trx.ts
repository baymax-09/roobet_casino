import { getBalancesByToken as getTrxBalanceDocs } from 'src/modules/crypto/tron/documents/tron_balances'
import {
  getTrxBalance,
  estimateTronBandwidth,
  getTronPrimaryWalletBalance,
  getTronPoolingWalletBalance,
} from 'src/modules/crypto/tron/lib'

import { analyticsLogger } from '../logger'
import { type AllBalances } from './defaults'

export const fetchTrxBalances = async (): Promise<
  AllBalances['trx'] | undefined
> => {
  const logger = analyticsLogger('fetchTrxBalances', { userId: null })

  try {
    const poolingWalletBalance = await getTronPoolingWalletBalance()
    const unpooledTrxBalanceDocs = await getTrxBalanceDocs('trx')
    const trxFee = await estimateTronBandwidth()
    let balanceInTrx = 0
    let balanceInUsd = 0
    const batchForTrx: Array<Promise<{ trx: number; usd: number }>> = []

    // build batch request
    for (const balance of unpooledTrxBalanceDocs) {
      const balanceRequest = getTrxBalance(balance.address)
      batchForTrx.push(balanceRequest)
    }

    // execute batch request and get response array
    const response = await Promise.all(batchForTrx)

    for (const balance of response) {
      balanceInTrx += balance.trx
      balanceInUsd += balance.usd
    }

    const { trx, usd } = await getTronPrimaryWalletBalance()

    return {
      confirmed: {
        tokens: trx,
        usd,
      },
      pending: {
        tokens: balanceInTrx + poolingWalletBalance.trx,
        usd: balanceInUsd + poolingWalletBalance.usd,
      },
      poolingFees: {
        tokens: trxFee.trx * unpooledTrxBalanceDocs.length,
        usd: trxFee.usd * unpooledTrxBalanceDocs.length,
      },
    }
  } catch (error) {
    logger.error('TRX Unpooled', {}, error)
    return undefined
  }
}
