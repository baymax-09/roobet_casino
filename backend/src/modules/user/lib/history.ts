import { type Model } from 'mongoose'

interface HistoryData {
  count: number
  data: any[]
}

/**
 * Retrieves paginated history for any mongoose model associated w/ req.user.id.
 */
export const paginateHistory = async (
  userId: string,
  limit: number,
  page: number,
  model: Model<any>,
  sortKey: string,
  sortOrder: 1 | -1,
  type?: string,
): Promise<HistoryData> => {
  const skip = page * limit
  const globalAggregationSteps = [
    { $match: { userId } },
    { $match: { ...(!!type && { type }) } },
  ]

  const data = await model.aggregate([
    ...globalAggregationSteps,
    { $sort: { [sortKey]: sortOrder } },
    { $skip: skip },
    { $limit: limit },
  ])

  const count = await model.aggregate([
    ...globalAggregationSteps,
    { $count: 'count' },
  ])

  return {
    count: count[0]?.count ?? 0,
    data,
  }
}
