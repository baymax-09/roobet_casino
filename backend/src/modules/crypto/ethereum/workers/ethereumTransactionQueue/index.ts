import { config } from 'src/system'
import { runWorker } from 'src/util/workerRunner'
import { createConsumer } from 'src/util/rabbitmq/lib/eventConsumer'
import handler from './handler'

export async function run() {
  if (config.isProd || config.isStaging) {
    runWorker('ethereumTransactionQueue', start)
  }
}

async function start(): Promise<void> {
  await createConsumer({
    exchangeName: 'events',
    routingKey: 'events.outboundEthereumTransaction',
    queue: 'outboundEthereumTransaction',
    handler,
  })
}
