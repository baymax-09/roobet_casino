import moment, { type Moment } from 'moment'
import {
  type AccumulatorOperator,
  type ObjectId,
  type PipelineStage,
} from 'mongoose'

import { mongoose } from 'src/system'
import { type User } from 'src/modules/user/types'
import { type DBCollectionSchema } from 'src/modules'
import { padArray } from 'src/util/helpers/lists'

import { type ExpandedStatName, type StatName, type UserStat } from '../types'
import { statsLogger } from '../lib/logger'

export interface StatsType extends Record<StatName, number | undefined> {
  id: string
  userId: string
  dayNumber: number
  kycLevel?: number | string
}

export interface UserStats extends StatsType {
  _id: ObjectId
  day: Date
}

interface GroupedUserStats {
  $group: Record<
    string,
    | {
        $sum: {
          $ifNull: [string, number]
        }
      }
    | string
    | null
  >
}

const UserStatsSchema = new mongoose.Schema<UserStats>(
  {
    id: { type: String },
    userId: { type: String },
    day: { type: Date, index: true },
    dayNumber: { type: Number, default: 0, index: true },
  },
  // We do not want strict: false in more collections, don't follow this pattern.
  { strict: false, timestamps: true },
)

UserStatsSchema.index({ userId: 1, day: 1 }, { unique: true })
UserStatsSchema.index({ createdAt: 1 })

const UserStatsModel = mongoose.model<UserStats>('userStats', UserStatsSchema)

async function getIdString(userId: string, todayString: string | null = null) {
  const today = todayString || moment().startOf('day').toISOString()
  return userId + '-' + today
}

export async function getUpcomingHRs() {
  return await UserStatsModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: moment().subtract(1, 'month').toDate(),
        },
      },
    },
    {
      $group: {
        _id: '$userId',
        sumDeposited: {
          $sum: '$deposited',
        },
      },
    },
    {
      $sort: {
        sumDeposited: -1,
      },
    },
    {
      $limit: 2000,
    },
  ])
}

async function getUserStatFieldSums(
  userIds: string[],
  startDate: string,
  endDate: string,
  fields: Readonly<StatName[]>,
): Promise<Array<Partial<UserStats>>> {
  endDate = moment(endDate).endOf('day').toISOString()

  const group: GroupedUserStats = {
    $group: {
      _id: '$userId',
    },
  }

  fields.forEach(field => {
    group.$group[field] = {
      $sum: {
        $ifNull: [`$${field}`, 0],
      },
    }
  })

  const userMatch = { userId: { $in: userIds } }

  const response = await UserStatsModel.aggregate([
    { $match: userMatch },
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
      },
    },
    // @ts-expect-error The way this has been implemented is extremely difficult if not impossible to type.
    group,
  ])

  return padArray<UserStats | object>(
    response,
    userIds.length,
    {},
  ).map<UserStats>(row => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const stats = { ...row } as UserStats

    fields.forEach(field => {
      if (!stats[field]) {
        stats[field] = 0
      }
    })
    return stats
  })
}

function getFilteredUserStatsGroupStage(groupFields: string[]): PipelineStage {
  let group: PipelineStage.Group = {
    $group: {
      _id: '$userId',
    },
  }

  groupFields.forEach(field => {
    group = {
      $group: {
        ...group.$group,
        [field]: {
          $sum: {
            $ifNull: [`$${field}`, 0],
          },
        },
      },
    }
  })
  return group
}

async function getFilteredUserStatFieldSums(
  userIds: string[],
  startDate: string,
  endDate: string,
  gameIdentifier?: string,
  excludedGames?: string[],
): Promise<Array<Partial<UserStats>>> {
  const totalBetFields: string[] = []
  let filteredBetField: string

  if (gameIdentifier) {
    totalBetFields.push(`${gameIdentifier}Bet`)
  } else if (!gameIdentifier && excludedGames?.length === 0) {
    totalBetFields.push('totalBet')
  } else if (!gameIdentifier && excludedGames && excludedGames?.length > 0) {
    totalBetFields.push('totalBet')
    excludedGames.forEach(field => {
      if (!totalBetFields.includes(field)) {
        totalBetFields.push(field)
      }
    })
    filteredBetField = 'filteredTotalBet'
  }

  const userMatch = {
    $match: {
      userId: { $in: userIds },
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    },
  }

  const response = await UserStatsModel.aggregate([
    userMatch,
    getFilteredUserStatsGroupStage(totalBetFields),
  ])

  return response.map(row => {
    if (row.totalBet && excludedGames && excludedGames.length > 0) {
      let subtractedAmount = 0
      excludedGames.forEach(game => {
        if (row[game]) {
          subtractedAmount += row[game]
        }
      })
      row[filteredBetField] = row.totalBet - subtractedAmount
    } else {
      row[filteredBetField] = row.totalBet || 0
    }

    const stats: Partial<UserStats> = { userId: row._id, ...row }
    return stats
  })
}

/**
 * @param startDate ISO string
 * @param endDate ISO string
 */
export async function sumUserStatFields(
  userId: string,
  startDate: string,
  endDate: string,
  fields: Readonly<StatName[]>,
): Promise<Partial<UserStats>> {
  const res = await getUserStatFieldSums([userId], startDate, endDate, fields)
  return res[0] ?? {}
}

/**
 * @param startDate ISO string
 * @param endDate ISO string
 * @param gameIdentifier string
 * @param excludedGames comma seperated string
 */
export async function sumBulkUserStatFields(
  userIds: string[],
  startDate: string,
  endDate: string,
  gameIdentifier?: string,
  excludedGames?: string[],
): Promise<Array<Partial<UserStats>>> {
  const res = await getFilteredUserStatFieldSums(
    userIds,
    startDate,
    endDate,
    gameIdentifier,
    excludedGames,
  )
  return res ?? []
}

export async function sumAllUserStatFields(
  startDate: Moment | string = moment().subtract(7, 'days'),
  endDate: Moment | string = moment(),
): Promise<UserStats[]> {
  return await UserStatsModel.find({
    day: {
      $gte: new Date(moment(startDate).startOf('day').toISOString()),
      $lte: new Date(moment(endDate).endOf('day').toISOString()),
    },
  }).lean<UserStats[]>()
}

export async function recordUserStats(
  user: Pick<User, 'id'>,
  stats: UserStat[],
) {
  if (!user || !user.id) {
    return
  }
  const today = moment().startOf('day').toISOString()
  const todayNumber = parseInt(moment().format('YYYYMMDD'))

  const incPayload = stats.reduce((acc, curr) => {
    const key: ExpandedStatName = curr.balanceType
      ? `${curr.balanceType}-${curr.key}`
      : curr.key
    return { ...acc, [key]: curr.amount }
  }, {})

  try {
    await UserStatsModel.findOneAndUpdate(
      {
        day: today,
        userId: user.id,
      },
      {
        id: await getIdString(user.id, today),
        $inc: incPayload,
        dayNumber: todayNumber,
        userId: user.id,
        day: today,
      },
      {
        upsert: true,
      },
    )
  } catch (error) {
    statsLogger('recordUserStats', { userId: user.id }).error(
      'error',
      { stats },
      error,
    )
  }
}

export async function hasDailyKeySetForUser(userId: string, key: StatName) {
  const id = await getIdString(userId)
  const userStats = await UserStatsModel.findOne({ id }).lean()
  return userStats && userStats[key]
}

export async function getUserStatsToday(user: User) {
  const id = await getIdString(user.id)
  const userStats = await UserStatsModel.findOne({ id }).lean()
  return userStats
}

export async function getUserStatsYesterday(user: User) {
  const today = moment().subtract(1, 'days').startOf('day').toISOString()
  const id = user.id + '-' + today
  const userStats = await UserStatsModel.findOne({ id }).lean()
  return userStats
}

/**
 * @param addFields I believe this is unused
 * @param group I believe this is unused
 */
export async function userStatsAggregation(
  startDate: string,
  endDate: string,
  addFields: unknown,
  group: { _id: any } | Record<string, AccumulatorOperator>,
  orderBy: string,
  limit?: number,
) {
  return await UserStatsModel.aggregate([
    {
      $match: {
        dayNumber: {
          $gte: parseInt(startDate),
          $lte: parseInt(endDate),
        },
      },
    },
    // @ts-expect-error The way this has been implemented is extremely difficult if not impossible to type.
    { $addFields: addFields },
    { $group: group },
    {
      $sort: {
        [orderBy]: -1,
      },
    },
    {
      $limit: limit || 100,
    },
  ])
    .allowDiskUse(true)
    .exec()
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: 'userStats',
}
