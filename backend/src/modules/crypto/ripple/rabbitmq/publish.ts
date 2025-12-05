import { type Options } from 'amqplib'

import { publishMessageToEventsExchange } from 'src/util/rabbitmq'
import {
  type CryptoOutboundConfirmationQueueMessage,
  type CryptoOutboundTransactionQueueMessage,
  type InboundTransactionQueueMessage,
} from '../../types'

export async function publishRippleInboundTransactionMessage(
  message: InboundTransactionQueueMessage,
  messageOptions?: Options.Publish,
) {
  const options = {
    ...messageOptions,
    type: 'INBOUND_TRANSACTION_RIPPLE',
    persistent: true,
    headers: { cc: 'inboundRippleTransaction' },
  }
  await publishMessageToEventsExchange(
    'payments.inboundRippleTransaction',
    message,
    options,
  )
}

export async function publishRippleWithdrawMessage(
  message: CryptoOutboundTransactionQueueMessage,
  messageOptions?: Options.Publish,
) {
  const options = {
    ...messageOptions,
    type: 'OUTBOUND_RIPPLE_TRANSACTION',
    persistent: true,
    headers: { cc: 'outboundRippleTransaction' },
  }
  await publishMessageToEventsExchange(
    'payments.outboundRippleTransaction',
    message,
    options,
  )
}

export async function publishRippleConfirmWithdrawMessage(
  message: CryptoOutboundConfirmationQueueMessage,
  messageOptions?: Options.Publish,
) {
  const options = {
    ...messageOptions,
    type: 'OUTBOUND_RIPPLE_CONFIRMATION',
    persistent: true,
    headers: { cc: 'outboundRippleConfirmation' },
  }
  await publishMessageToEventsExchange(
    'payments.outboundRippleConfirmation',
    message,
    options,
  )
}
