import { type Options } from 'amqplib'

import { publishMessageToEventsExchange } from 'src/util/rabbitmq'
import {
  type InboundTransactionQueueMessage,
  type CryptoOutboundTransactionQueueMessage,
  type CryptoOutboundConfirmationQueueMessage,
} from '../../types'

export async function publishTronInboundTransactionMessage(
  message: InboundTransactionQueueMessage,
  messageOptions?: Options.Publish,
) {
  const options = {
    ...messageOptions,
    type: 'INBOUND_TRANSACTION_TRON',
    persistent: true,
    headers: { cc: 'inboundTronTransaction' },
  }
  await publishMessageToEventsExchange(
    'payments.inboundTronTransaction',
    message,
    options,
  )
}

export async function publishTronWithdrawMessage(
  message: CryptoOutboundTransactionQueueMessage,
  messageOptions?: Options.Publish,
) {
  const options = {
    ...messageOptions,
    type: 'OUTBOUND_TRON_TRANSACTION',
    persistent: true,
    headers: { cc: 'outboundTronTransaction' },
  }
  await publishMessageToEventsExchange(
    'payments.outboundTronTransaction',
    message,
    options,
  )
}

export async function publishTronPoolingMessage(
  message: CryptoOutboundTransactionQueueMessage,
  messageOptions?: Options.Publish,
) {
  const options = {
    ...messageOptions,
    type: 'POOLING_TRON',
    persistent: true,
    headers: { cc: 'poolingTron' },
  }
  await publishMessageToEventsExchange('payments.poolingTron', message, options)
}

export async function publishTronConfirmWithdrawMessage(
  message: CryptoOutboundConfirmationQueueMessage,
  messageOptions?: Options.Publish,
) {
  const options = {
    ...messageOptions,
    type: 'OUTBOUND_TRON_CONFIRMATION',
    persistent: true,
    headers: { cc: 'outboundTronConfirmation' },
  }
  await publishMessageToEventsExchange(
    'payments.outboundTronConfirmation',
    message,
    options,
  )
}
