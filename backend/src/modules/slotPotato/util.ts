import {
  subtractTimeInMs,
  addTimeInMs,
  timeIsBetween,
} from 'src/util/helpers/time'
import { createScheduledEvent } from 'src/util/eventScheduler'
import { config } from 'src/system'

import { SLOT_POTATO_EVENT_START } from './workers/slotPotatoEvent'
import { type SlotPotato, type SlotPotatoGame } from './documents/slotPotato'

const { slotPotato: slotPotatoConfig } = config

export const determineActiveGame = (
  startDateTime: Date,
  gameDuration: number,
  games: SlotPotatoGame[],
):
  | (SlotPotatoGame & { startDateTime: Date; endDateTime: Date })
  | undefined => {
  const gamesWithDuration = games.map(game => {
    const endTime = addTimeInMs(gameDuration * game.order, startDateTime)
    return {
      ...game,
      startDateTime: subtractTimeInMs(gameDuration, endTime),
      endDateTime: endTime,
    }
  })

  const activeGame = gamesWithDuration.find(game => {
    return timeIsBetween(new Date(), game.startDateTime, game.endDateTime)
  })

  return activeGame
}

export const getEndDateTime = (
  startDateTime: Date,
  gameDuration: number,
  multipliedBy: number,
) => {
  return addTimeInMs(gameDuration * multipliedBy, startDateTime)
}

export const scheduleSlotPotatoEvent = async (slotPotato: SlotPotato) => {
  const { _id, startDateTime, gameDuration, games } = slotPotato
  return await createScheduledEvent(
    SLOT_POTATO_EVENT_START,
    new Date(
      subtractTimeInMs(slotPotatoConfig.eventStartBuffer, startDateTime),
    ),
    { slotPotatoId: _id.toString(), timeStarted: new Date() },
    getEndDateTime(startDateTime, gameDuration, games.length),
  )
}

export const isActive = (slotPotato: SlotPotato): boolean => {
  const { startDateTime, gameDuration, games, disabled } = slotPotato
  const endDateTime = getEndDateTime(startDateTime, gameDuration, games.length)
  return (
    !disabled &&
    timeIsBetween(
      new Date(),
      new Date(
        subtractTimeInMs(
          slotPotatoConfig.eventStartBuffer,
          new Date(startDateTime),
        ),
      ),
      endDateTime,
    )
  )
}
