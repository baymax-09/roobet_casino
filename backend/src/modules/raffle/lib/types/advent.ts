import moment from 'moment'
import crypto from 'crypto'

import { config } from 'src/system'
import {
  hasDailyKeySetForUser,
  getUserStatsYesterday,
  recordStats,
} from 'src/modules/stats'
import { getUserById } from 'src/modules/user'
import { isSystemEnabled } from 'src/modules/userSettings'

import { type RaffleType, type CoinSide } from '.'
import { raffleLogger } from '../logger'

type AdventRakeback = Record<
  string,
  {
    percent: number
    min: number
  }
>

// April 2, 05:00 UTC - April 10, 05:00 UTC
export const rakebackByDay: AdventRakeback = {
  1: { percent: 10, min: 0.015 },
  2: { percent: 11, min: 0.015 },
  3: { percent: 12, min: 0.015 },
  4: { percent: 13, min: 0.015 },
  5: { percent: 14, min: 0.015 },
  6: { percent: 15, min: 0.015 },
  7: { percent: 16, min: 0.015 },
  8: { percent: 17, min: 0.015 },
  9: { percent: 18, min: 0.015 },
  10: { percent: 19, min: 0.015 },
  11: { percent: 19, min: 0.015 },
  12: { percent: 20, min: 0.015 },
  13: { percent: 20, min: 0.015 },
  14: { percent: 20, min: 0.015 },
  15: { percent: 21, min: 0.015 },
  16: { percent: 21, min: 0.015 },
  17: { percent: 21, min: 0.015 },
  18: { percent: 22, min: 0.015 },
  19: { percent: 22, min: 0.015 },
  20: { percent: 22, min: 0.015 },
  21: { percent: 23, min: 0.015 },
  22: { percent: 23, min: 0.015 },
  23: { percent: 25, min: 0.015 },
  24: { percent: 25, min: 0.015 },
  25: { percent: 26, min: 0.015 },
}

// Returns heads or tails based on random int.
const cryptoRandomSide = (): CoinSide => {
  return crypto.randomInt(0, 2) === 1 ? 'heads' : 'tails'
}

export const adventRaffle: RaffleType = {
  rakeback: true,

  awardTickets: true,

  calcRakeback: async (raffle, userId, dryRun, coinSide?: CoinSide) => {
    const user = await getUserById(userId)

    if (!user) {
      return { success: false, reason: 'Sorry, there is no user.' }
    }

    const day = moment().format('D')
    const rakebackToday = rakebackByDay[day]

    if (!rakebackToday) {
      return { success: false, reason: 'Sorry, there are no gifts for today!' }
    }

    // Verify user has wagered $50 during their account lifetime.
    const statsEnabled = await isSystemEnabled(user, 'stats')
    const hiddenTotalBet = user.hiddenTotalBet || 0

    if (hiddenTotalBet < 50 && statsEnabled && config.isProd) {
      return {
        success: false,
        reason: 'You must have wagered $50+ before you can claim gifts.',
      }
    }

    // Verify user has not already claimed rakeback.
    if (!dryRun) {
      const hasClaimedToday = await hasDailyKeySetForUser(userId, 'raffleGifts')

      if (hasClaimedToday) {
        return {
          success: false,
          reason: "You've already claimed today's gift.",
        }
      }
    }

    // Calculate the total rakeback amount based on yesterday's wagered.
    const yesterdayStats = await getUserStatsYesterday(user)
    const betYesterday =
      yesterdayStats && yesterdayStats.totalBet ? yesterdayStats.totalBet : 0
    const rakebackPercent = rakebackToday.percent / 100

    const baseAmount = betYesterday
      ? Math.max(betYesterday * 0.018 * rakebackPercent, rakebackToday.min)
      : rakebackToday.min

    const coinflipAmount = (() => {
      if (!coinSide || dryRun) {
        return baseAmount
      }

      const randomSide = cryptoRandomSide()

      const wonCoinflip = coinSide === randomSide

      if (wonCoinflip) {
        return baseAmount * 2
      }

      return 0
    })()

    const formattedAmount = coinflipAmount.toFixed(4)

    // If not dry run, record stats to gate multiple claims.
    if (!dryRun) {
      await recordStats(user, [
        { key: 'raffleGifted', amount: coinflipAmount },
        { key: 'raffleGifts', amount: 1 },
      ])

      raffleLogger('adventRaffle/calcRakeback', { userId }).info(
        `Advent raffle: Awarded ${user.id} $${formattedAmount}. Day: ${day}. Bet Yesterday: ${betYesterday}`,
        { formattedAmount, day, betYesterday, amount: coinflipAmount },
      )
    }

    return { success: true, amount: coinflipAmount }
  },
  hasClaimedRakeback: async (_, userId) => {
    const hasClaimedToday = await hasDailyKeySetForUser(userId, 'raffleGifts')

    return !!hasClaimedToday
  },
}
