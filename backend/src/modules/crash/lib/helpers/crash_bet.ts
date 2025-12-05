import {
  betUpdateFeedForGameId,
  prepareAndCloseoutActiveBet,
} from 'src/modules/bet'
import { APIValidationError } from 'src/util/errors'
import { BasicCache } from 'src/util/redisModels'
import { type BalanceType, type User } from 'src/modules/user/types'
import { type ActiveBet } from 'src/modules/bet/types'
import { crashLogger } from '../logger'

import { type CrashGame } from 'src/modules/crash/documents/crash_game'
import { growthFunction } from './hash'

/** @todo this should probably extend the activeBet type */
export interface CrashBet {
  balanceType: BalanceType
  betAmount: number
  userId: string
  closedOut: boolean
  id: string
  manuallyClosedOut?: boolean
  manuallyClosedOutAt?: Date
  user: Pick<User, 'id' | 'name'> // TODO should be null if incognito is true
  cashoutCrashPoint: number
  upgradeItems?: string[]
  payoutValue: number
  incognito?: boolean
}

export async function addBetFeedIfNotExists(game: CrashGame) {
  if (!game.activeBets) {
    game.activeBets = {}
  }
  if (!game.betFeed) {
    game.betFeed = await getBetFeedForGame(game)
  }
}

export function closeoutBetFeedIfExists(game: CrashGame) {
  if (game.betFeed) {
    game.betFeed.close()
    game.betFeed = null
  }
}

export async function getBetFeedForGame(game: CrashGame) {
  return await betUpdateFeedForGameId(game.id, async function (bet) {
    game.activeBets[bet.id] = bet
  })
}

/**
 * Cash out any bets that haven't been closed out
 * Not asynchronous so we are smooth as butter
 */
export async function cashoutActiveBetsForGame(
  game: CrashGame,
  currentCrashPoint: number,
) {
  const cashoutFunction = async (bet: ActiveBet) => {
    const isAutoCashOut =
      bet.autoCashout &&
      bet.autoCashout <= currentCrashPoint &&
      bet.autoCashout <= game.crashPoint
    if (isAutoCashOut) {
      bet.payoutValue = (bet.autoCashout ?? 0) * bet.betAmount
      bet.cashoutCrashPoint = bet.autoCashout
    } else if (bet.manuallyClosedOut) {
      bet.payoutValue = currentCrashPoint * bet.betAmount
      bet.cashoutCrashPoint = currentCrashPoint
    }

    if (bet.payoutValue) {
      try {
        await prepareAndCloseoutActiveBet(bet, false)
      } catch (error) {
        crashLogger('cashoutFunction', { userId: bet.userId }).error(
          'error closing bet',
          { bet },
          error,
        )
      }
    }
  }

  Object.values(game.activeBets)
    .filter(bet => !bet.closedOut)
    .forEach(bet => {
      // we moved this to a worker pool of threads to speed up ticks
      cashoutFunction(bet)
      // pool.exec(cashoutFunction, [bet])
    })
}

export async function safeCheckGameRunning() {
  const crashPoint = await BasicCache.get('crash', 'crashPoint')
  const runningStartTime = new Date(
    await BasicCache.get('crash', 'runningStartTime'),
  )
  const runningMs = Date.now() - runningStartTime.getTime()
  // T + 250 to take into account lag time of getting to the next tick etc.
  const currentCrashPoint = growthFunction(runningMs + 100)
  if (currentCrashPoint < crashPoint) {
    return true
  } else {
    throw new APIValidationError('crash__game_ended')
  }
}
