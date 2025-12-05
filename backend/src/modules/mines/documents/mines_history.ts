import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import {
  type ActiveMinesGame,
  type MinesDeck,
  type PlayedMinesCards,
} from './active_mines_games'
interface MinesGameFilter {
  betId?: string
  userId?: string
}

export interface MinesHistory {
  _id: string
  id: string
  bet: string
  deck: MinesDeck
  played: PlayedMinesCards
  minesCount: number
  gridCount: number
  userId: string
  timestamp: Date
}

const MinesHistorySchema = new mongoose.Schema<MinesHistory>(
  {
    bet: { type: String, index: true },
    deck: Map,
    minesCount: Number,
    gridCount: Number,
    played: Map,
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

const MinesHistoryModel = mongoose.model<MinesHistory>(
  'mines_histories',
  MinesHistorySchema,
)

export async function insertMinesHistory(
  game: Omit<ActiveMinesGame, 'id'>,
): Promise<MinesHistory> {
  return await MinesHistoryModel.create(game)
}

export async function getMinesHistoryByBet(
  betId: string,
): Promise<MinesHistory | null> {
  return await MinesHistoryModel.findOne({ bet: betId })
}

export async function getMinesHistoryForUser({
  userId,
  limit = 10,
}: {
  userId: string
  limit?: number
}): Promise<MinesHistory[]> {
  return await MinesHistoryModel.find({ userId }).limit(limit)
}

export async function getMinesHistoryForUserNoLimit({
  filterObj,
  sortObj,
}: {
  filterObj: MinesGameFilter
  sortObj?: any
}): Promise<{ data: MinesHistory[]; count: number }> {
  const query = MinesHistoryModel.find(filterObj)

  const [data, count] = await Promise.all([
    query.sort(sortObj).lean(),
    MinesHistoryModel.countDocuments(filterObj),
  ])

  return {
    data,
    count,
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: MinesHistoryModel.collection.name,
}
