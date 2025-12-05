import { runWorker } from 'src/util/workerRunner'
import { createConsumer } from 'src/util/rabbitmq/lib/eventConsumer'
import { handler } from './handler'

export async function run() {
  runWorker('gameResolutionQueue', start)
}

async function start(): Promise<void> {
  await createConsumer({
    exchangeName: 'events',
    routingKey: 'events.resolveGame',
    queue: 'resolveGame',
    handler,
    prefetch: 0,
  })
}
