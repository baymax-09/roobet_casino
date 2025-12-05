import {
  getStartOfToday,
  getStatsDaysBack,
  type RethinkStats,
} from 'src/modules/stats/documents/stats'

type StrippedStatsForMod = Pick<
  RethinkStats,
  'day' | 'chatMessages' | 'uniqueChatUsers' | 'id'
>

interface PayloadType<T> {
  today: T | null
  yesterday: T
  last30: T[]
  last7: T[]
}

export const stats = async (hasGlobalStatsReadAccess: boolean) => {
  const payload: PayloadType<RethinkStats> = {
    today: await getStartOfToday(),
    yesterday: (await getStatsDaysBack(2))[1],
    last30: await getStatsDaysBack(30),
    last7: await getStatsDaysBack(7),
  }

  if (!hasGlobalStatsReadAccess) {
    const stripStats = (day: RethinkStats) => {
      return {
        chatMessages: day.chatMessages,
        day: day.day,
        uniqueChatUsers: day.uniqueChatUsers,
        id: day.id,
      }
    }
    const strippedPayload: PayloadType<StrippedStatsForMod> = {
      today: payload.today ? stripStats(payload.today) : null,
      yesterday: stripStats(payload.yesterday),
      last30: payload.last30.map((row: RethinkStats) => {
        return stripStats(row)
      }),
      last7: payload.last7.map((row: RethinkStats) => {
        return stripStats(row)
      }),
    }

    return strippedPayload
  }
  return payload
}
