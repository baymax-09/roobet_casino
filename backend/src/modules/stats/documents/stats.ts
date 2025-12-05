import moment from 'moment-timezone'

import { r } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { type StatsType } from './userStats'
import { type ExpandedStatName, type UserStat } from '../types'

export interface RethinkStats extends StatsType {
  day: string
}

const DailyGlobalStats = r.table<RethinkStats>('stats')

type UpdateStats = { dayNumber: number } & Partial<
  Record<ExpandedStatName, number>
>
interface InsertStats extends UpdateStats {
  id: string
  day: string
}

export async function getStatsBetweenDays(start: string, end: string) {
  const globalStats = await DailyGlobalStats.between(start, end, {
    index: 'day',
    rightBound: 'closed',
  })
    .orderBy(r.desc('day'))
    .run()
  return globalStats
}

export async function getStatsDaysBack(daysBack = 2) {
  return await DailyGlobalStats.orderBy({ index: r.desc('day') })
    .limit(daysBack)
    .run()
}

export async function getStatsToday() {
  const today = moment.tz(moment(), 'America/Chicago').format('YYYY-MM-DD')
  return await DailyGlobalStats.get(today).run()
}

/**
 * This is slightly different than {@link getStatsToday} but seems to be in the same spirit. Timezones are confusing.
 */
export async function getStartOfToday() {
  const today = moment().startOf('day').toISOString()
  return await DailyGlobalStats.get(today).run()
}

export async function getStatsInRange(startDate: string, endDate: string) {
  return await DailyGlobalStats.between(
    parseInt(startDate),
    parseInt(endDate),
    { index: 'dayNumber', rightBound: 'closed' },
  ).run()
}

export async function recordDailyGlobalStats(userStats: UserStat[]) {
  const today = moment.tz(moment(), 'America/Chicago').format('YYYY-MM-DD')
  const todayNumber = parseInt(
    moment.tz(moment(), 'America/Chicago').format('YYYYMMDD'),
  )
  const data = await DailyGlobalStats.get(today).run()

  const toUpdateStats: UpdateStats = { dayNumber: todayNumber }
  const toInsertStats: InsertStats = {
    id: today,
    day: today,
    dayNumber: todayNumber,
  }

  for (const stat of userStats) {
    const newKey: ExpandedStatName = !stat.balanceType
      ? stat.key
      : `${stat.balanceType}-${stat.key}`

    if (data) {
      toUpdateStats[newKey] = r
        .row(newKey)
        .add(stat.amount)
        .default(stat.amount)
    } else {
      toInsertStats[newKey] = stat.amount
    }
  }

  if (data) {
    await DailyGlobalStats.get(today).update(toUpdateStats).run()
  } else {
    await DailyGlobalStats.insert(toInsertStats).run()
  }
}

export async function recordDailyGlobalStat(userStat: UserStat) {
  await recordDailyGlobalStats([userStat])
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'stats',
  indices: [{ name: 'day' }, { name: 'dayNumber' }],
}
