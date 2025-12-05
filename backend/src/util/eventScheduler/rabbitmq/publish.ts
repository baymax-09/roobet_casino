import { type Options } from 'amqplib'

import { publishMessageToEventsExchange } from 'src/util/rabbitmq'

interface HandleScheduledEventArgs {
  queue: string
  payload: object
}

export async function publishScheduledEvent(
  { queue, payload }: HandleScheduledEventArgs,
  messageOptions?: Options.Publish,
) {
  const options = {
    ...messageOptions,
    type: 'SCHEDULED_EVENTS',
    persistent: true,
    headers: { cc: queue },
  }

  await publishMessageToEventsExchange('events.reports', payload, options)
}
