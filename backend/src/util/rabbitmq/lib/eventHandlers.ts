import { type Channel } from 'amqplib'

import { config } from 'src/system'
import { getRabbitMQConnection, getRabbitMQChannel } from 'src/system/rabbitmq'
import {
  type ExchangeName,
  type RoutingKey,
  type MessageOptions,
} from 'src/util/rabbitmq/types'
import { TransactionInstrumentor } from 'src/util/instrumentation'
import { rabbitmqLogger } from './logger'

export async function createChannel(
  handler: (channel: Channel) => Promise<void>,
  routingKey: RoutingKey<ExchangeName>,
): Promise<void> {
  const logger = rabbitmqLogger('createChannel', { userId: null })

  try {
    const connectionEmitter = await getRabbitMQConnection('producer')

    connectionEmitter.on('error', error => {
      logger.error(
        `Error creating ${routingKey} channel, producer connection error`,
        { routingKey },
        error,
      )
    })

    await new Promise<void>((resolve, reject) => {
      connectionEmitter.once('ready', async () => {
        try {
          const channel = await getRabbitMQChannel('producer', routingKey)

          if (!channel) {
            reject(`[RabbitMQ] - Unable to create ${routingKey} channel`)
            return
          }
          await handler(channel)
          resolve()
        } catch (error) {
          logger.error(`Error creating ${routingKey} channel`, {}, error)
          reject(error)
        } finally {
          connectionEmitter.removeAllListeners()
        }
      })
    }).catch()
  } catch (error) {
    logger.error(
      `Unable to create ${routingKey} channel`,
      { routingKey },
      error,
    )
  }
}

const instrument = TransactionInstrumentor(
  'rabbitmq_publish',
  config.datadog.threshold.rabbitmqSlowOperationThresholdSeconds,
)

/** Generic Handler for Message Publishing */
function handlePublishEvent<T extends object>(exchangeKey: ExchangeName) {
  return async (
    routingKey: RoutingKey<ExchangeName>,
    messagePayload: T,
    options: MessageOptions,
  ) => {
    const endMeasurement = instrument.start()
    await createChannel(async channel => {
      await channel.publish(
        exchangeKey,
        routingKey,
        Buffer.from(JSON.stringify(messagePayload)),
        {
          ...options,
          type: options.type,
          persistent: options.persistent,
          headers: options.headers,
        },
      )
    }, routingKey)
    endMeasurement()
  }
}

export const publishMessageToEventsExchange = handlePublishEvent('events')
