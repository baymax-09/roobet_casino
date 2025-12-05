import { Types } from 'mongoose'
import moment from 'moment'
import { GraphQLError } from 'graphql'

import { timeIsBetween } from 'src/util/helpers/time'
import { getGame } from 'src/modules/tp-games/documents/games'

import { isActive, getEndDateTime } from '../util'
import {
  createSlotPotato as createSlotPotatoRecord,
  updateSlotPotato as updateSlotPotatoRecord,
  getUpcomingSlotPotatoes,
  getActiveSlotPotato,
  getSlotPotatoes,
  type SlotPotato,
  type SlotPotatoGame,
  getSlotPotato,
} from '../documents/slotPotato'

type NewSlotPotato = Omit<
  SlotPotato,
  '_id' | 'isActive' | 'startEventId' | 'endEventId'
>

// Should this just return a boolean?
const checkGameExists = async (games: SlotPotatoGame[]) => {
  const gameIds = games
    ? games.map(({ gameId }) => new Types.ObjectId(gameId))
    : []

  for (const gameId of gameIds) {
    const game = await getGame({ _id: gameId })
    if (!game) {
      throw new GraphQLError(`Game ${gameId} not found`, {})
    }
  }
}

export const checkForEventConflicts = async (
  newSlotPotato: Omit<NewSlotPotato, 'disabled'>,
  potatoesToCheck: SlotPotato[],
): Promise<boolean> => {
  const newEndTime = getEndDateTime(
    newSlotPotato.startDateTime,
    newSlotPotato.gameDuration,
    newSlotPotato.games.length,
  )
  const startDateTime = moment.isMoment(newSlotPotato.startDateTime)
    ? newSlotPotato.startDateTime
    : moment(newSlotPotato.startDateTime)

  return potatoesToCheck.some(slotPotato => {
    const endTime = getEndDateTime(
      slotPotato.startDateTime,
      slotPotato.gameDuration,
      slotPotato.games.length,
    )
    const isStartConflict = timeIsBetween(
      moment(startDateTime),
      moment(slotPotato.startDateTime),
      moment(endTime),
    )
    const isEndConflict = timeIsBetween(
      moment(newEndTime),
      moment(slotPotato.startDateTime),
      moment(endTime),
    )
    return isStartConflict || isEndConflict
  })
}

export const getAllCurrentOrUpcomingPotatoes = async (): Promise<
  SlotPotato[]
> => {
  const upcomingSlotPotatoes = await getUpcomingSlotPotatoes()
  const activeSlotPotato = await getActiveSlotPotato()
  return activeSlotPotato
    ? [...upcomingSlotPotatoes, activeSlotPotato]
    : upcomingSlotPotatoes
}

export async function createSlotPotato(payload: NewSlotPotato) {
  await checkGameExists(payload.games)
  return await createSlotPotatoRecord(payload)
}

export async function updateSlotPotato(
  id: string | Types.ObjectId,
  payload: Partial<SlotPotato>,
) {
  if (payload.games?.length) {
    await checkGameExists(payload.games)
  }
  return await updateSlotPotatoRecord(id, payload)
}

export async function getAllSlotPotatoes() {
  const slotPotatoes = await getSlotPotatoes()
  return slotPotatoes.map(slotPotato => ({
    ...slotPotato,
    isActive: isActive(slotPotato),
  }))
}

export async function getSlotPotatoesByIds(ids: string[]) {
  const slotPotatoes = await Promise.all(
    ids.map(async id => {
      const sp = await getSlotPotato(id)
      if (sp) {
        return { ...sp, isActive: isActive(sp) }
      }
      return null
    }),
  )
  return slotPotatoes
}
