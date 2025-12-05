import { createHash } from 'crypto'

import { BasicCache } from 'src/util/redisModels'
import { useSlack } from 'src/vendors/slack'

const DEBOUNCE_CACHE_NAME = 'anomalyDetection'

export const shouldDebounce = async (message: string): Promise<boolean> => {
  // Create sha1 hash from message.
  const debounceToken = createHash('sha1').update(message).digest('hex')

  const shouldDebounce = await BasicCache.get(
    DEBOUNCE_CACHE_NAME,
    debounceToken,
  )

  return !!shouldDebounce
}

export const setDebounce = async (
  message: string,
  debounceMinutes: number,
): Promise<void> => {
  // Create sha1 hash from message.
  const debounceToken = createHash('sha1').update(message).digest('hex')
  const expireAfterSeconds = debounceMinutes * 60

  await BasicCache.set(
    DEBOUNCE_CACHE_NAME,
    debounceToken,
    true,
    expireAfterSeconds,
  )
}

export const sendSlackMessage = (message: string, channel: string): void => {
  // Create Slack transport instance for the specific channel.
  const send = useSlack(channel, 'Fraud Anomaly Detection')

  // Send message, do not await or report errors (this interface doesn't support it).
  send(message)
}
