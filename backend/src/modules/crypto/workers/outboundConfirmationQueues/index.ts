import {
  type RoutingKey,
  type ExchangeName,
  type Queue,
} from 'src/util/rabbitmq'
import { runWorker } from 'src/util/workerRunner'
import { createConsumer } from 'src/util/rabbitmq/lib/eventConsumer'

import { handler } from './handler'

interface OutboundTransactionConfig {
  routingKey: RoutingKey<ExchangeName>
  queue: Queue
}

export async function run() {
  runWorker('outboundConfirmationQueues', start)
}
async function start(): Promise<void> {
  const rippleOutboundConsumer: OutboundTransactionConfig = {
    routingKey: 'payments.outboundRippleConfirmation',
    queue: 'outboundRippleConfirmation',
  }

  const tronOutboundConsumer: OutboundTransactionConfig = {
    routingKey: 'payments.outboundTronConfirmation',
    queue: 'outboundTronConfirmation',
  }

  const outboundQueueConsumers = [rippleOutboundConsumer, tronOutboundConsumer]

  for (const consumer of outboundQueueConsumers) {
    await createConsumer({
      exchangeName: 'payments',
      routingKey: consumer.routingKey,
      queue: consumer.queue,
      handler,
      prefetch: 0,
    })
  }
}
