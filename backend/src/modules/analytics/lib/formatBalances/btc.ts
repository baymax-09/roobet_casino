import { bitcoinBlockioApi } from 'src/vendors/blockio'

import { analyticsLogger } from '../logger'
import { type AllBalances } from './defaults'

export const fetchBtcBalances = async (
  btcRate: number,
): Promise<AllBalances['crypto'] | undefined> => {
  const logger = analyticsLogger('fetchBtcBalances', { userId: null })
  try {
    const blockioBtcBalance = await bitcoinBlockioApi.getBalance()
    const blockioBtcBalancePending = await bitcoinBlockioApi.getBalance(true)

    return {
      pending: {
        tokens: blockioBtcBalancePending,
        usd: Math.floor(btcRate * blockioBtcBalancePending),
      },
      confirmed: {
        tokens: blockioBtcBalance,
        usd: Math.floor(btcRate * blockioBtcBalance),
      },
    }
  } catch (error) {
    logger.error('error getting blockio balance', {}, error)
    return undefined
  }
}
