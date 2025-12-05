import {
  betUpdateFeedForGameId,
  prepareAndCloseoutActiveBet,
} from 'src/modules/bet'
import { APIValidationError } from 'src/util/errors'
import { BasicCache } from 'src/util/redisModels'
import { type BalanceType, type User } from 'src/modules/user/types'

import { type HotboxGame } from '../../documents/hotbox_game'
import { type ActiveBet } from 'src/modules/bet/types'
import { growthFunction } from './hash'
import { hotboxLogger } from '../logger'

/** @todo this should probably extend the activeBet type */
export interface HotboxBet {
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

export async function addBetFeedIfNotExists(game: HotboxGame) {
  if (!game.activeBets) {
    game.activeBets = {}
  }
  if (!game.betFeed) {
    game.betFeed = await getBetFeedForGame(game)
  }
}

export function closeoutBetFeedIfExists(game: HotboxGame) {
  if (game.betFeed) {
    game.betFeed.close()
    game.betFeed = null
  }
}

export async function getBetFeedForGame(game: HotboxGame) {
  return await betUpdateFeedForGameId(game.id, async function (bet) {
    game.activeBets[bet.id] = bet
  })
}

/**
 * Cash out any bets that haven't been closed out
 * Not asynchronous so we are smooth as butter
 */
export async function cashoutActiveBetsForGame(
  game: HotboxGame,
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
        hotboxLogger('cashoutActiveBetsForGame/cashoutFunction', {
          userId: bet.userId,
        }).error(`error closing bet`, { game, bet }, error)
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
  const crashPoint = await BasicCache.get('hotbox', 'crashPoint')
  const runningStartTime = new Date(
    await BasicCache.get('hotbox', 'runningStartTime'),
  )
  const runningMs = Date.now() - runningStartTime.getTime()
  // T + 250 to take into account lag time of getting to the next tick etc.
  const currentCrashPoint = growthFunction(runningMs + 100)
  if (currentCrashPoint < crashPoint) {
    return true
  } else {
    throw new APIValidationError('hotbox__game_ended')
  }
}
