import { TatumSDK, type Network } from '@tatumio/tatum'

import { config } from 'src/system/config'
import { scopedLogger } from 'src/system/logger'

import { type UTXOTatumSDKType } from '../types/network'

const webhookURL =
  config.tatum.webhooks.baseUrl + config.tatum.webhooks.addressEventsEndpoint
const { apiKey, loggerId } = config.tatum.keys
const tatumSubscriptions = scopedLogger(loggerId)
const logger = tatumSubscriptions('subscriptions', { userId: null })

export async function subscribeToAddressEvents(
  network: Network,
  address: string,
) {
  const provider = await TatumSDK.init<UTXOTatumSDKType>({
    apiKey,
    network,
  })

  try {
    return await provider.notification.subscribe.addressEvent({
      address,
      url: webhookURL,
    })
  } catch (error) {
    logger.error(
      'Failed to subscribe to address events',
      { network, address },
      error,
    )
    throw error
  } finally {
    provider.destroy()
  }
}

export async function unsubscribeFromAddressEvents(
  network: Network,
  subscriptionId: string,
) {
  const provider = await TatumSDK.init<UTXOTatumSDKType>({
    apiKey,
    network,
  })

  try {
    await provider.notification.unsubscribe(subscriptionId)
  } catch (error) {
    logger.error(
      'Failed to unsubscribe from address events',
      { network, subscriptionId },
      error,
    )
    throw error
  } finally {
    provider.destroy()
  }
}
