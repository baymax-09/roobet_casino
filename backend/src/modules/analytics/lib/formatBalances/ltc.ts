import { litecoinBlockioApi } from 'src/vendors/blockio'

import { analyticsLogger } from '../logger'
import { type AllBalances } from './defaults'

export const fetchLtcBalances = async (
  ltcRate: number,
): Promise<AllBalances['ltc'] | undefined> => {
  const logger = analyticsLogger('fetchLtcBalances', { userId: null })

  try {
    const blockioLtcBalance = await litecoinBlockioApi.getBalance()
    const blockioLtcBalancePending = await litecoinBlockioApi.getBalance(true)

    return {
      pending: {
        tokens: blockioLtcBalancePending,
        usd: Math.floor(ltcRate * blockioLtcBalancePending),
      },
      confirmed: {
        tokens: blockioLtcBalance,
        usd: Math.floor(ltcRate * blockioLtcBalance),
      },
    }
  } catch (error) {
    logger.error('error getting blockio balance', {}, error)
    return undefined
  }
}
