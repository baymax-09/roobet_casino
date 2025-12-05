import { type Options } from 'amqplib'

import { publishMessageToEventsExchange } from 'src/util/rabbitmq'

import { type SeonResponseJob } from '../types'

export async function publishSeonHookEvent(
  message: SeonResponseJob,
  messageOptions?: Options.Publish,
) {
  const options = {
    ...messageOptions,
    type: 'SEON_HOOK',
    persistent: true,
    headers: { cc: 'seonHooks' },
  }

  await publishMessageToEventsExchange('events.seonHooks', message, options)
}
