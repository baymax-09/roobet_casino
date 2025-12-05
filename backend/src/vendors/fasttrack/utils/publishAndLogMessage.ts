import {
  type RoutingKey,
  type ExchangeName,
  type MessageOptions,
} from 'src/util/rabbitmq/types'
import { publishMessageToEventsExchange } from 'src/util/rabbitmq'

import { fasttrackLogger } from '../lib/logger'

export const publishAndLogMessage = async (
  routingKey: RoutingKey<ExchangeName>,
  messagePayload: Record<string, any>,
  options: MessageOptions,
  userId: string | null = null,
) => {
  fasttrackLogger('publishAndLogMessage', { userId }).info(routingKey, {
    messagePayload,
    options,
  })

  await publishMessageToEventsExchange(routingKey, messagePayload, options)
}
