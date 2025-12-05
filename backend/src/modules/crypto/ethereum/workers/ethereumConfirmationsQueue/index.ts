import { config } from 'src/system'
import { runWorker } from 'src/util/workerRunner'
import { createConsumer } from 'src/util/rabbitmq/lib/eventConsumer'
import { confirmPendingTransaction } from './handler'

export async function run() {
  if (config.isProd || config.isStaging) {
    runWorker('ethereumConfirmationsQueue', start)
  }
}

async function start(): Promise<void> {
  await createConsumer({
    exchangeName: 'events',
    routingKey: 'events.confirmEthereumTransaction',
    queue: 'confirmEthereumTransaction',
    handler: confirmPendingTransaction,
    prefetch: 0,
  })
}
