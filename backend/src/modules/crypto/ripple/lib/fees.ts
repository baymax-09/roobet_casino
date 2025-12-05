import { Client, dropsToXrp } from 'xrpl'

import { config } from 'src/system'
import { convertCurrencyToUserBalance } from 'src/modules/currency'
import { BasicCache } from 'src/util/redisModels'

import { getRippleFee } from './api'
import { cryptoLogger } from '../../lib/logger'

interface RippleFee {
  drops: number
  xrp: number
  usd: number
}

const { processName, keyName, expires } = config.ripple.fee
const { minThresholdUSD } = config.ripple.fee

async function setRippleFee() {
  const client = new Client(config.ripple.wsProvider)
  await client.connect()
  let drops
  let xrp
  let usd
  try {
    drops = await getRippleFee(client)
    xrp = parseFloat(dropsToXrp(drops))
    usd = await convertCurrencyToUserBalance(xrp, 'xrp')
    const estimateFee: RippleFee = { drops, xrp, usd }

    await BasicCache.set(processName, keyName, estimateFee, expires)

    return estimateFee
  } catch (error) {
    cryptoLogger('ripple/fees/setRippleFee', { userId: null }).error(
      `Unable to get Ripple Fee - ${error.message}`,
      { drops, xrp, usd },
      error,
    )
    throw new Error(`Unable to get Ripple Fee - ${error.message}`)
  } finally {
    await client.disconnect()
  }
}

export async function estimateRippleFee(skipCache = false): Promise<RippleFee> {
  if (!skipCache) {
    const fee: RippleFee | null = await BasicCache.get(processName, keyName)
    if (fee) {
      return fee
    }
  }

  return await setRippleFee()
}

export function checkFeePaidByUser(rippleFee: RippleFee): RippleFee {
  if (rippleFee.usd < minThresholdUSD) {
    return {
      xrp: 0,
      drops: 0,
      usd: 0,
    }
  } else {
    return rippleFee
  }
}
