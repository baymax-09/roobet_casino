import { dogecoinBlockioApi } from 'src/vendors/blockio'

import { analyticsLogger } from '../logger'
import { type AllBalances } from './defaults'

export const fetchDogeBalances = async (
  dogeRate: number,
): Promise<AllBalances['doge'] | undefined> => {
  const logger = analyticsLogger('fetchDogeBalances', { userId: null })

  try {
    const blockioDogeBalance = await dogecoinBlockioApi.getBalance()
    const blockioDogeBalancePending = await dogecoinBlockioApi.getBalance(true)

    return {
      pending: {
        tokens: blockioDogeBalancePending,
        usd: Math.floor(dogeRate * blockioDogeBalancePending),
      },
      confirmed: {
        tokens: blockioDogeBalance,
        usd: Math.floor(dogeRate * blockioDogeBalance),
      },
    }
  } catch (error) {
    logger.error('error getting blockio balance', {}, error)
    return undefined
  }
}
