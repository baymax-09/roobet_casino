import { type Options } from 'amqplib'

import { publishMessageToEventsExchange } from 'src/util/rabbitmq'

import { type GameResolutionMessage } from '../types'

export const publishGameResolutionEvent = async (
  message: GameResolutionMessage<any>,
  messageOptions?: Options.Publish,
) => {
  const options = {
    ...messageOptions,
    type: 'RESOLVE_GAME',
    persistent: true,
    headers: { cc: 'resolveGame' },
  }

  await publishMessageToEventsExchange('events.resolveGame', message, options)
}
