import { runWorker } from 'src/util/workerRunner'
import { io, config } from 'src/system'
import { createConsumer } from 'src/util/rabbitmq/lib/eventConsumer'

import { slotPotatoLogger } from '../lib/logger'

const { slotPotato: slotPotatoConfig } = config

export const SLOT_POTATO_EVENT_START = 'slotPotatoEventStart'

const handler = () => {
  slotPotatoLogger('handler', { userId: null }).info(
    `Slot Potato Event is starting in ${slotPotatoConfig.eventStartBuffer} minutes`,
  )
  io.emit(SLOT_POTATO_EVENT_START, false)
}
const start = async () => {
  await createConsumer({
    exchangeName: 'events',
    routingKey: 'events.scheduledEvents',
    queue: SLOT_POTATO_EVENT_START,
    handler,
  })
}

export const run = async () => {
  await runWorker('slotPotatoEvent', start)
}
