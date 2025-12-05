import { type Options } from 'amqplib'

import { publishMessageToEventsExchange } from 'src/util/rabbitmq'

export async function publishReportEvent(
  payload: {
    report: string
    params: object
    requestingUserId?: string
  },
  messageOptions?: Options.Publish,
) {
  const message = {
    ...payload,
    requestedTimestamp: new Date().toISOString(),
  }

  const options = {
    ...messageOptions,
    type: 'REPORT',
    persistent: true,
    headers: { cc: 'reports' },
  }

  await publishMessageToEventsExchange('events.reports', message, options)
}
