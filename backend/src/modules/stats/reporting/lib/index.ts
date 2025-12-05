import { reports, report } from './api'
import { run } from './run'
import {
  dailyStatsForUser,
  massUploadUser,
  stats,
  statsByRange,
  userStats,
  userBalances,
  userBalancesAfterRun,
} from './reports'

export const REPORTS = reports({
  dailyStatsForUser: {
    run: async ({
      startDate,
      endDate,
      userId,
    }: {
      startDate: string
      endDate: string
      userId: string
    }) => await dailyStatsForUser(startDate, endDate, userId),
  },

  massUploadUser: {
    run: async ({
      data,
    }: {
      data: Array<{ userId?: string; username?: string }>
    }) => await massUploadUser(data),
  },

  stats: {
    run: async ({
      hasGlobalStatsReadAccess,
    }: {
      hasGlobalStatsReadAccess: boolean
    }) => await stats(hasGlobalStatsReadAccess),
  },

  statsByRange: {
    run: async ({
      startDate,
      endDate,
    }: {
      startDate: string
      endDate: string
    }) => await statsByRange(startDate, endDate),
  },

  userStats: {
    run: async ({
      orderBy,
      startDate,
      endDate,
      limit,
    }: {
      orderBy: string
      startDate: string
      endDate: string
      limit?: number
    }) => await userStats(orderBy, startDate, endDate, limit),
  },

  userBalances: report({
    run: userBalances,
    afterRun: userBalancesAfterRun,
  }),
})

export const runReport = run(REPORTS)

export const isValidReport = (
  report: string,
): report is keyof typeof REPORTS => {
  return report in REPORTS
}
