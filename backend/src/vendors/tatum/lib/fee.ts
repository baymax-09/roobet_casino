import { TatumSDK, type Network } from '@tatumio/tatum'

import { config } from 'src/system/config'
import { scopedLogger } from 'src/system/logger'

import { type UTXOTatumSDKType } from '../types/network'

const { apiKey, loggerId } = config.tatum.keys
const tatumSubscriptions = scopedLogger(loggerId)
const logger = tatumSubscriptions('fee', { userId: null })

export async function getCurrentFeeEstimate(network: Network) {
  const provider = await TatumSDK.init<UTXOTatumSDKType>({
    apiKey,
    network,
  })

  try {
    return await provider.fee.getCurrentFee()
  } catch (error) {
    logger.error('Failed to get current fee estimate', { network }, error)
    throw error
  } finally {
    provider.destroy()
  }
}
