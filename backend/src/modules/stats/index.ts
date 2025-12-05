export * as Documents from './documents'

export {
  getStatsBetweenDays,
  getStatsDaysBack,
  getStatsToday,
  getStatsInRange,
  recordDailyGlobalStat,
} from './documents/stats'
export {
  incrementUniqueStat,
  decrementUniqueStat,
  recordStat,
  recordStats,
  incrementStat,
} from './lib/userEventStatUpdates'
export {
  getUpcomingHRs,
  sumUserStatFields,
  recordUserStats,
  hasDailyKeySetForUser,
  getUserStatsToday,
  getUserStatsYesterday,
} from './documents/userStats'
export { shouldRecordStatsForUser } from './lib/'

export * as UserStatsModel from './documents/userStats'
