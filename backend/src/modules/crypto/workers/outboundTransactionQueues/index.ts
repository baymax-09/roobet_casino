import {
  type ExchangeName,
  type Queue,
  type RoutingKey,
  createConsumer,
} from 'src/util/rabbitmq'
import { runWorker } from 'src/util/workerRunner'

import { handler } from './handler'

interface OutboundTransactionConfig {
  routingKey: RoutingKey<ExchangeName>
  queue: Queue
}

export async function run() {
  runWorker('outboundTransactionQueues', start)
}

async function start(): Promise<void> {
  const rippleOutboundConsumer: OutboundTransactionConfig = {
    routingKey: 'payments.outboundRippleTransaction',
    queue: 'outboundRippleTransaction',
  }

  const tronOutboundConsumer: OutboundTransactionConfig = {
    routingKey: 'payments.outboundTronTransaction',
    queue: 'outboundTronTransaction',
  }

  const outboundQueueConsumers = [rippleOutboundConsumer, tronOutboundConsumer]

  for (const consumer of outboundQueueConsumers) {
    await createConsumer({
      exchangeName: 'payments',
      routingKey: consumer.routingKey,
      queue: consumer.queue,
      handler,
    })
  }
}
