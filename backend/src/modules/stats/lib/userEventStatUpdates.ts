import moment from 'moment-timezone'

import { redis } from 'src/system'
import { type User, type BalanceType } from 'src/modules/user/types'

import { recordDailyGlobalStats } from '../documents/stats'
import { recordUserStats } from '../documents/userStats'
import { recordLifetimeUserStats } from '../documents/lifetimeUserStats'
import { shouldRecordStatsForUser } from '../lib'
import { type StatName, type UserStat } from '../types'

export async function recordStat(
  user: User,
  globalStat: UserStat,
  override = false,
) {
  const shouldRecordStat = await shouldRecordStatsForUser(user)
  if (override || shouldRecordStat) {
    await recordDailyGlobalStats([globalStat])
  }
  await recordUserStats(user, [globalStat])
  await recordLifetimeUserStats(user, [globalStat])
}

export async function recordStats(user: User, stats: UserStat[]) {
  await recordUserStats(user, stats)
  await recordLifetimeUserStats(user, stats)
  const shouldRecordStat = await shouldRecordStatsForUser(user)
  if (shouldRecordStat) {
    await recordDailyGlobalStats(stats)
  }
}

export async function incrementStat(
  user: User,
  key: StatName,
  override: boolean,
) {
  const shouldRecord = await shouldRecordStatsForUser(user)
  if (override || shouldRecord) {
    await recordStats(user, [{ key, amount: 1 }])
  }
}

export async function writeBetStats(
  user: User,
  gameName: string,
  amount: number,
) {
  const stats: UserStat[] = [
    { key: `${gameName}Bets`, amount: 1 },
    { key: `${gameName}Bet`, amount },
    { key: 'totalBet', amount },
    { key: 'totalBets', amount: 1 },
  ]

  await recordStats(user, stats)
}

export async function writeWinStats(
  user: User,
  gameName: string,
  amount: number,
) {
  const stats: UserStat[] = [
    { key: `${gameName}Wins`, amount: 1 },
    { key: `${gameName}Won`, amount },
    { key: 'totalWon', amount },
  ]

  await recordStats(user, stats)
}

export async function writeWithdrawalStats(
  user: User,
  amount: number,
  balanceType: BalanceType,
) {
  const stats: UserStat[] = [
    { key: 'withdrawn', amount, balanceType },
    { key: 'withdrawals', amount: 1, balanceType },
    { key: 'withdrawn', amount },
    { key: 'withdrawals', amount: 1 },
  ]

  await recordStats(user, stats)
}

export async function writeDepositStats(
  user: User,
  amount: number,
  balanceType: BalanceType,
) {
  const stats: UserStat[] = [
    { key: 'deposited', amount, balanceType },
    { key: 'deposits', amount: 1, balanceType },
    { key: 'deposited', amount },
    { key: 'deposits', amount: 1 },
  ]

  await recordStats(user, stats)
}

export async function incrementUniqueStat(
  user: User,
  key: StatName,
  amount: number,
) {
  const shouldRecord = await shouldRecordStatsForUser(user)
  if (shouldRecord) {
    const today = moment.tz(moment(), 'America/Chicago').format('YYYY-MM-DD')
    const hash = `unique:${user.id}:${today}:${key}`
    const result = await redis.getAsync(hash)
    if (result === user.id) {
      return
    }
    await redis.set(hash, user.id)
    await recordStats(user, [{ key, amount }])
  }
}

export async function decrementUniqueStat(
  user: User,
  key: StatName,
  amount: number,
) {
  const shouldRecord = await shouldRecordStatsForUser(user)
  if (shouldRecord) {
    const today = moment.tz(moment(), 'America/Chicago').format('YYYY-MM-DD')
    const hash = `unique:${user.id}:${today}:${key}:decrement`
    const result = await redis.getAsync(hash)
    if (result === user.id) {
      return
    }
    await redis.set(hash, user.id)
    await recordStats(user, [{ key, amount: -1 * Math.abs(amount) }])
  }
}
