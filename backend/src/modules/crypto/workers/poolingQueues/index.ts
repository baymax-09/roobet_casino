import {
  type ExchangeName,
  type Queue,
  type RoutingKey,
  createConsumer,
} from 'src/util/rabbitmq'
import { runWorker } from 'src/util/workerRunner'

import { handler } from '../outboundTransactionQueues/handler'

interface PoolingConfig {
  routingKey: RoutingKey<ExchangeName>
  queue: Queue
}

export async function run() {
  runWorker('poolingQueues', start)
}

async function start(): Promise<void> {
  const tronPoolingConsumer: PoolingConfig = {
    routingKey: 'payments.poolingTron',
    queue: 'poolingTron',
  }

  const poolingConsumers = [tronPoolingConsumer]

  for (const consumer of poolingConsumers) {
    await createConsumer({
      exchangeName: 'payments',
      routingKey: consumer.routingKey,
      queue: consumer.queue,
      handler,
    })
  }
}
