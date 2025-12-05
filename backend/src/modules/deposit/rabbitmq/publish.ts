import { type Options } from 'amqplib'

import { publishMessageToEventsExchange } from 'src/util/rabbitmq'
import { type DepositQueueMessage } from '../types'

export async function publishDepositMessage(
  message: DepositQueueMessage,
  messageOptions?: Options.Publish,
) {
  const options = {
    ...messageOptions,
    type: 'DEPOSIT',
    persistent: true,
    headers: { cc: 'deposit' },
  }
  await publishMessageToEventsExchange('payments.deposit', message, options)
}
