import { type Options } from 'amqplib'

import { publishMessageToEventsExchange } from 'src/util/rabbitmq'

import {
  type ConfirmationsQueueMessage,
  type TransactionsQueueMessage,
} from '../types'

export const publishConfirmEthereumTransactionEvent = async (
  message: ConfirmationsQueueMessage,
  messageOptions?: Options.Publish,
) => {
  const options = {
    ...messageOptions,
    type: 'CONFIRM_ETHEREUM_TRANSACTION',
    persistent: true,
    headers: { cc: 'confirmEthereumTransaction' },
  }
  await publishMessageToEventsExchange(
    'events.confirmEthereumTransaction',
    message,
    options,
  )
}

export const publishSendEthereumTransactionEvent = async (
  message: TransactionsQueueMessage,
  messageOptions?: Options.Publish,
) => {
  const options = {
    ...messageOptions,
    type: 'SEND_ETHEREUM_TRANSACTION',
    persistent: true,
    headers: { cc: 'outboundEthereumTransaction' },
  }
  await publishMessageToEventsExchange(
    'events.outboundEthereumTransaction',
    message,
    options,
  )
}
