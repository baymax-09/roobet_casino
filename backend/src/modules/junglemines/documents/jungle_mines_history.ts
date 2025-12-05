import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import {
  type JungleMinesDeck,
  type PlayedJungleMinesCards,
} from './active_jungle_mines_games'

interface JungleMinesGameFilter {
  betId?: string
  userId?: string
}

export interface JungleMinesHistory {
  _id: string
  id: string
  bet: string
  deck: JungleMinesDeck
  played: PlayedJungleMinesCards
  minesCount: number
  userId: string
  timestamp: Date
}

const JungleMinesHistorySchema = new mongoose.Schema<JungleMinesHistory>(
  {
    bet: { type: String, index: true },
    deck: Map,
    minesCount: Number,
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

const JungleMinesHistoryModel = mongoose.model<JungleMinesHistory>(
  'jungle_mines_histories',
  JungleMinesHistorySchema,
)

export async function getJungleMinesHistoryByBet(
  betId: string,
): Promise<JungleMinesHistory | null> {
  return await JungleMinesHistoryModel.findOne({ bet: betId })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: JungleMinesHistoryModel.collection.name,
}
