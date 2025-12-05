import { type ChangeEvent } from 'rethinkdbdash'

import {
  socketNamespaces,
  config,
  r,
  winston,
  isValidSocketNamespaceKey,
} from 'src/system'
import { recursiveChangefeedHandler } from 'src/util/rethink'

import { isHouseGameName, type HouseGameName } from './types'

export * as Workers from './workers'
export * as Routes from './routes'
export * as Types from './types'
export * from './lib'
export {
  buildGameHashTable,
  startNewPregeneratedGame,
} from './lib/provably_fair/pregenerated'

export const gamesList = [
  'dice',
  'roulette',
  'crash',
  'mines',
  'towers',
  'SoftSwiss',
] as const

export function getGameEdge(gameName?: string, payout?: number) {
  if (payout) {
    return 100 - payout
  }
  if (isHouseGameName(gameName)) {
    return config[gameName].edge
  }
  return 1
}

export function getMinBetForGame(gameName: HouseGameName) {
  return config[gameName].minBet
}

export function getMaxBetForGame(gameName: HouseGameName) {
  return Number(config[gameName].maxBet)
}

export async function emitSocketEventForGame(
  gameName: HouseGameName,
  eventName: string,
  payload: unknown,
) {
  const key = `/${gameName}`

  if (!isValidSocketNamespaceKey(key)) {
    return
  }

  socketNamespaces[key].emit(eventName, payload)
}

export async function emitSocketEventForGameForUser(
  gameName: HouseGameName,
  userId: string,
  eventName: string,
  payload: unknown,
) {
  const key = `/${gameName}`

  if (!isValidSocketNamespaceKey(key)) {
    return
  }

  socketNamespaces[key].to(userId).emit(eventName, payload)
}

export async function gameFeed<T>(
  gameName: HouseGameName,
  processFunction: (game: T) => any,
) {
  const newFeed = () => {
    return r.table(`${gameName}_games`).changes().run()
  }
  const handleChange = async (change: ChangeEvent<T>) => {
    if (change && change.new_val) {
      let payload = change.new_val
      if (processFunction) {
        payload = await processFunction(payload)
      }
      if (payload) {
        emitSocketEventForGame(gameName, `${gameName}GameUpdate`, payload)
      }
    }
  }

  const opts = {
    ...config.rethinkdb.changefeedReconnectOptions,
    changefeedName: `${gameName}_games`,
    logger: winston,
  }

  await recursiveChangefeedHandler(newFeed, handleChange, opts)
}
