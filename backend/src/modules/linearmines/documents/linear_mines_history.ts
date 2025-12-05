import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import {
  type ActiveLinearMinesGame,
  type LinearMinesDeck,
  type PlayedMinesCards,
} from './active_linear_mines_games'

export interface LinearMinesHistory {
  _id: string
  id: string
  bet: string
  deck: LinearMinesDeck
  played: PlayedMinesCards
  minesCount: number
  userId: string
}

const LinearMinesHistorySchema = new mongoose.Schema<LinearMinesHistory>(
  {
    bet: String,
    deck: Map,
    minesCount: Number,
    played: Map,
    // @ts-expect-error string vs date
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

const LinearMinesHistoryModel = mongoose.model<LinearMinesHistory>(
  'linear_mines_histories',
  LinearMinesHistorySchema,
)

export async function insertLinearMinesHistory(
  game: ActiveLinearMinesGame,
): Promise<LinearMinesHistory> {
  return await LinearMinesHistoryModel.create(game)
}

export async function getLinearMinesHistoryByBet(
  betId: string,
): Promise<LinearMinesHistory | null> {
  return await LinearMinesHistoryModel.findOne({ bet: betId })
}

export async function getLinearMinesHistoryForUser({
  userId,
  limit = 10,
}: {
  userId: string
  limit?: number
}): Promise<LinearMinesHistory[]> {
  return await LinearMinesHistoryModel.find({ userId }).limit(limit)
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: LinearMinesHistoryModel.collection.name,
}
