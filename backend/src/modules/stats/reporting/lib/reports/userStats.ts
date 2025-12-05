import { getUserById } from 'src/modules/user'
import { APIValidationError } from 'src/util/errors'
import { getStatsToday, UserStatsModel } from 'src/modules/stats'
import { type RethinkStats } from 'src/modules/stats/documents/stats'
import { mapBalanceInformation, totalBalance } from 'src/modules/user/balance'

export const userStats = async (
  orderBy: string,
  startDate: string,
  endDate: string,
  limit?: number,
) => {
  const todayStats = await getStatsToday()

  if (!todayStats) {
    throw new APIValidationError('Unable to fetch stats')
  }

  const possibleFields = Object.keys(todayStats) as Array<keyof RethinkStats>
  const numberFields = possibleFields.filter(
    value => !isNaN(Number(todayStats[value])),
  )

  const addFields: Record<string, any> = {}
  const group: Record<string, any> = {
    _id: '$userId',
  }
  for (const field of numberFields) {
    addFields[field] = {
      $ifNull: ['$' + field, 0],
    }
    group[field] = {
      $sum: '$' + field,
    }
  }

  const payload = await UserStatsModel.userStatsAggregation(
    startDate,
    endDate,
    addFields,
    group,
    orderBy,
    limit,
  )

  const results = []
  for (const row of payload) {
    /*
     * If this function is slow, then skip querying for the user here.
     * Problem is that the data is now in two different databases.
     */
    const user = await getUserById(row._id)

    if (!user) {
      continue
    }

    const userBalances = await mapBalanceInformation(user)

    const resultRow = {
      stats: row,
      user: {
        ...user,
        totalBalance: totalBalance(userBalances),
      },
    }
    results.push(resultRow)
  }
  return results
}
