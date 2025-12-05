import { runWorker } from 'src/util/workerRunner'
import { createConsumer } from 'src/util/rabbitmq/lib/eventConsumer'
import { handler } from './handler'

export async function run() {
  runWorker('depositQueue', start)
}

async function start(): Promise<void> {
  await createConsumer({
    exchangeName: 'payments',
    routingKey: 'payments.deposit',
    queue: 'deposit',
    handler,
  })
}
