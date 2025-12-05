import { type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

interface PlinkoGameFilter {
  betId?: string
  userId?: string
}

export interface BasePlinkoGame {
  betId: string
  userId: string
  risk: number
  rows: number
  payoutMultiplier: number
  boardIndex: number
  hole: number
  clientSeed: string
  roundId: string
  roundHash: string
  nonce: number
  autoBet: boolean
}

export interface PlinkoGame extends BasePlinkoGame {
  id: string
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const PlinkoHistorySchema = new mongoose.Schema<PlinkoGame>(
  {
    betId: { type: String, index: true },
    risk: Number,
    rows: Number,
    payoutMultiplier: Number,
    boardIndex: Number,
    hole: Number,
    clientSeed: String,
    roundId: String,
    roundHash: String,
    nonce: Number,
    autoBet: Boolean,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 30 * 1,
    },
    userId: { type: String, index: true },
  },
  { timestamps: true },
)

const PlinkoHistoryModel = mongoose.model<PlinkoGame>(
  'plinko_history',
  PlinkoHistorySchema,
)

export async function insertPlinkoHistory(
  game: BasePlinkoGame,
): Promise<PlinkoGame> {
  return await PlinkoHistoryModel.create(game)
}

export async function getPlinkoHistoryByBet(
  betId: string,
): Promise<PlinkoGame | null> {
  const plinkoHistory = await PlinkoHistoryModel.find({ betId })
  if (!plinkoHistory || plinkoHistory.length === 0) {
    return null
  }

  return plinkoHistory[0]
}

export async function getPlinkoHistoryForUser({
  userId,
  limit = 10,
}: {
  userId: string
  limit: number
}): Promise<PlinkoGame[]> {
  return await PlinkoHistoryModel.find({ userId }).limit(limit)
}

export async function getPlinkoHistoryForUserNoLimit({
  filterObj,
  sortObj,
}: {
  filterObj: PlinkoGameFilter
  sortObj?: any
}): Promise<{ data: PlinkoGame[]; count: number }> {
  const query = PlinkoHistoryModel.find(filterObj)

  const [data, count] = await Promise.all([
    query.sort(sortObj).lean(),
    PlinkoHistoryModel.countDocuments(filterObj),
  ])

  return {
    data,
    count,
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: 'plinko_history',
}
