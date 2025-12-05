import { type Options } from 'amqplib'

import { type TPGame } from 'src/modules/tp-games'
import { isDisabled } from 'src/modules/tp-games/documents/blocks'
import { TPGamesModel } from 'src/modules/tp-games/documents/games'

import { publishAndLogMessage } from '../utils'

interface TPGameMessage {
  tpGame: TPGame
}

export const FASTTRACK_GAME_FIELDS = [
  'identifier',
  'title',
  'provider',
  'category',
  'devices',
  'approvalStatus',
] as const

export const publishTPGameChangeEvent = async (
  { tpGame }: TPGameMessage,
  messageOptions?: Options.Publish,
) => {
  const tpGameInit = new TPGamesModel().init(tpGame)

  const messagePayload = {
    game_id: tpGameInit.identifier,
    name: tpGameInit.title,
    slug: `game/${tpGameInit.identifier}`,
    provider: tpGameInit.provider,
    category: tpGameInit.category,
    subcategory: '',
    supported_devices: tpGameInit.devices,
    last_modified: tpGameInit.updatedAt,
    is_live: !(await isDisabled(tpGameInit, undefined)),
    origin: ['roobet.com'],
  }

  const options = {
    ...messageOptions,
    type: 'GAME',
    persistent: true,
    headers: { cc: 'fasttrack' },
  }

  await publishAndLogMessage('events.tpGameChanged', messagePayload, options)
}
