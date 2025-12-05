import { type HouseGamesWithVerification } from '../types'
import { MutexLock } from 'src/util/named-lock'

/* 10 min in ms; arbitrary amount of time to lock out user when the release fails */
const GAME_ROUND_MUTEX_EXPIRY_MS = 1000 * 60 * 10

export const acquireHouseGameRoundLock = async (
  gameName: HouseGamesWithVerification,
  userId: string,
) => {
  return await MutexLock.acquireLock(
    userId,
    gameName,
    'round',
    GAME_ROUND_MUTEX_EXPIRY_MS,
  )
}

// @todo: Add roundModify & roundUse locks in here.
