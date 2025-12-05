import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { type User } from 'src/modules/user/types/User'
import { type Category } from 'src/modules/bet/types/Bet'

import { type ExpandedStatName, type UserStat } from '../types'
import { statsLogger } from '../lib/logger'

type PreferenceCategory = Category | 'house'

interface LifetimeUserStats {
  id: string
  userId: string
  wageredByCategory?: Record<PreferenceCategory, number>
}

const LifetimeUserStatsSchema = new mongoose.Schema(
  {
    id: String,
    userId: { type: String, index: true },
    wageredByCategory: { type: Object },
  },
  // We do not want strict: false in more collections, don't follow this pattern.
  { strict: false, timestamps: true },
)

const LifetimeUserStatsModel = mongoose.model<LifetimeUserStats>(
  'LifetimeUserStats',
  LifetimeUserStatsSchema,
)

export async function recordLifetimeUserStats(
  user: Pick<User, 'id'>,
  stats: UserStat[],
) {
  if (!user || !user.id) {
    return
  }

  const incPayload = stats.reduce((acc, curr) => {
    const key: ExpandedStatName = curr.balanceType
      ? `${curr.balanceType}-${curr.key}`
      : curr.key
    return { ...acc, [key]: curr.amount }
  }, {})

  await LifetimeUserStatsModel.findOneAndUpdate(
    {
      userId: user.id,
    },
    {
      $inc: incPayload,
      userId: user.id,
    },
    {
      upsert: true,
    },
  )
}

export const incrementGamePreference = async (
  userId: string,
  gameType: PreferenceCategory,
  amountWagered = 0,
) => {
  try {
    await LifetimeUserStatsModel.findOneAndUpdate(
      {
        userId,
      },
      {
        $inc: { [`wageredByCategory.${gameType}`]: amountWagered },
      },
      { upsert: true, new: true },
    )
  } catch (error) {
    statsLogger('incrementGamePreference', { userId }).error(
      'Failed to increment game preference for user',
      {},
      error,
    )
  }
}

async function getLifetimeUserStatsByUserId(userId: string) {
  return await LifetimeUserStatsModel.findOne({ userId }).lean()
}

// TODO move out of documents
export const getTopGamePreferences = async (userId: string, amount = 3) => {
  const stats = await getLifetimeUserStatsByUserId(userId)
  if (!stats?.wageredByCategory) {
    return []
  }

  const preferences = Object.entries(stats.wageredByCategory)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value) // descending order
    .map(({ key }) => key)
    .slice(0, amount)

  return preferences
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: 'LifetimeUserStats',
}
