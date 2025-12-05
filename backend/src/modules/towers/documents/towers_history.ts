import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'

import { type ActiveTowersGame } from '../documents/active_towers_games'

export interface TowersHistory extends ActiveTowersGame {
  _id?: string
}

interface TowersGameFilter {
  betId?: string
  userId?: string
}

const TowersHistorySchema = new mongoose.Schema<TowersHistory>(
  {
    bet: { type: String, index: true },
    columns: Number,
    deck: Map,
    difficulty: String,
    poopPerRow: Number,
    rows: Number,
    played: Map,
    // @ts-expect-error string vs Date
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 60 * 60 * 24 * 30 * 3,
    },
    userId: { type: String, index: true },
  },
  { timestamps: true },
)

const TowersHistoryModel = mongoose.model<TowersHistory>(
  'towers_histories',
  TowersHistorySchema,
)

export async function insertTowersHistory(game: ActiveTowersGame) {
  await TowersHistoryModel.create(game)
}

export async function getTowersHistoryByBet(
  betId: string,
): Promise<TowersHistory | null> {
  return await TowersHistoryModel.findOne({ bet: betId })
}

export async function getTowersHistoryForUser({
  filterObj,
  sortObj,
}: {
  filterObj: TowersGameFilter
  sortObj?: any
}): Promise<{ data: TowersHistory[]; count: number }> {
  const query = TowersHistoryModel.find(filterObj)

  const [data, count] = await Promise.all([
    query.sort(sortObj).lean(),
    TowersHistoryModel.countDocuments(filterObj),
  ])

  return {
    data,
    count,
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: TowersHistoryModel.collection.name,
}
