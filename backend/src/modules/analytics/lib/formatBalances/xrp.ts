import { getRipplePrimaryWalletBalance } from 'src/modules/crypto/ripple/lib'

import { analyticsLogger } from '../logger'
import { type AllBalances } from './defaults'

export const fetchXrpBalances = async (): Promise<
  AllBalances['xrp'] | undefined
> => {
  const logger = analyticsLogger('fetchXrpBalances', { userId: null })

  try {
    const { xrp, usd } = await getRipplePrimaryWalletBalance()
    return {
      confirmed: {
        tokens: xrp,
        usd,
      },
    }
  } catch (error) {
    logger.error('error getting ripple balance', {}, error)
    return undefined
  }
}
