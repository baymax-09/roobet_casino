import { type AsyncOrSync } from 'ts-essentials'
import { type Options } from 'amqplib'

import { getRabbitMQConnection, getRabbitMQChannel } from 'src/system/rabbitmq'
import {
  type ExchangeName,
  type RoutingKey,
  type Queue,
} from 'src/util/rabbitmq'
import { instrumentRMQMessage } from 'src/util/trace'
import { scopedLogger } from 'src/system/logger'

interface CreateConsumerArgs {
  exchangeName: ExchangeName
  routingKey: RoutingKey<ExchangeName>
  queue: Queue
  handler: (message: any) => AsyncOrSync<unknown>
  prefetch?: number
  options?: Options.Consume
}

const rabbitLogger = scopedLogger('rabbitmq')

export const createConsumer = async ({
  exchangeName,
  routingKey,
  queue,
  handler,
  prefetch = 1,
  options,
}: CreateConsumerArgs) => {
  const consumerLogger = rabbitLogger(`${queue}-${routingKey}`, { userId: '' })
  try {
    const connectionEmitter = await getRabbitMQConnection('consumer')

    connectionEmitter.on('close', () => {
      consumerLogger.error('[RabbitMQ] - Error connection closed', {
        queue,
        routingKey,
      })
    })

    connectionEmitter.on('error', error => {
      consumerLogger.error('[RabbitMQ] - Error connecting consumer:', error)
    })

    // Consume channel when connection is ready.
    connectionEmitter.on('ready', async connection => {
      try {
        consumerLogger.info(
          `[RabbitMQ] - Consumer subscribing to ${queue} on ${exchangeName} with routing key ${routingKey}...`,
        )

        const channel = await getRabbitMQChannel('consumer', routingKey)
        if (!channel) {
          throw Error(`[RabbitMQ] - Error getting channel: ${routingKey}`)
        }

        channel?.prefetch(prefetch, false)

        await channel?.consume(
          queue,
          async message => {
            await instrumentRMQMessage(message, async () => {
              if (!message) {
                consumerLogger.error(
                  '[RabbitMQ] - No message received on queue:',
                  { queue },
                )
                return
              }

              try {
                const messageContent = JSON.parse(message.content.toString())
                await handler(messageContent)
              } catch (error) {
                consumerLogger.error(
                  `[RabbitMQ] - Error processing message from ${queue} on ${exchangeName} with routing key ${routingKey}:`,
                  error,
                )
              } finally {
                channel?.ack(message)
              }
            })
          },
          {
            ...options,
            noAck: false,
          },
        )
      } catch (error) {
        connection.emit('error', error)
      }
    })
  } catch (error) {
    consumerLogger.error(
      `[RabbitMQ] - Error subscribing to ${queue} on ${exchangeName} with routing key ${routingKey}`,
      error,
    )
    throw error
  }
}
