import { APIValidationError } from 'src/util/errors'
import { getStatsToday, getStatsInRange } from 'src/modules/stats'
import { type RethinkStats } from 'src/modules/stats/documents/stats'

export const statsByRange = async (startDate: string, endDate: string) => {
  const todayStats = await getStatsToday()

  if (!todayStats) {
    throw new APIValidationError('Unable to fetch stats')
  }

  const possibleFields = Object.keys(todayStats) as Array<keyof RethinkStats>
  const numberFields = possibleFields.filter(
    value => !isNaN(Number(todayStats[value])),
  )

  const data = await getStatsInRange(startDate, endDate)

  const payload: Record<string, number> = {
    deposited: 0,
    withdrawn: 0,
  }

  data.forEach(dataRow => {
    numberFields.forEach(listKey => {
      if (!payload[listKey]) {
        payload[listKey] = 0
      }
      // @ts-expect-error listKey will be a field that contains a number value
      payload[listKey] += dataRow[listKey]
    })
  })

  const quickView = {
    depositWithdrawProfit: payload.deposited - payload.withdrawn,
  }

  return { stats: payload, quickView }
}
