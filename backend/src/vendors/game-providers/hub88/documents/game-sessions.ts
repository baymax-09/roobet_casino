import moment from 'moment'
import {
  type FilterQuery,
  type UpdateWithAggregationPipeline,
  type UpdateQuery,
} from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'
import { cleanupOldTableMongo } from 'src/util/mongo'
import { type BalanceType } from 'src/modules/user/types'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'

export interface Hub88GameSession {
  gameSessionId: string
  gameId: string
  userId: string
  betAmount: number
  payAmount: number
  currency: DisplayCurrency
  promo: boolean
  finished?: boolean
  balanceType: BalanceType
  createdAt: Date
}

const Hub88GameSessionSchema = new mongoose.Schema<Hub88GameSession>(
  {
    gameSessionId: { type: String, index: true },
    gameId: String,
    userId: { type: String, index: true },
    betAmount: Number,
    payAmount: Number,
    currency: String,
    promo: Boolean,
    finished: Boolean,
    balanceType: String,
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
)

Hub88GameSessionSchema.index({ finished: 1, updatedAt: 1 })

const Hub88GameSessionModel = mongoose.model<Hub88GameSession>(
  'hub88_game_sessions',
  Hub88GameSessionSchema,
)

export async function updateGameSession(
  filter: FilterQuery<Hub88GameSession>,
  payload: UpdateQuery<Hub88GameSession> | UpdateWithAggregationPipeline,
  createPayload:
    | UpdateQuery<Hub88GameSession>
    | UpdateWithAggregationPipeline = {},
) {
  const exists = await Hub88GameSessionModel.findOne(filter)
  const gameSessionToUpsert = exists
    ? payload
    : { ...payload, ...createPayload }
  const game = await Hub88GameSessionModel.findOneAndUpdate(
    filter,
    gameSessionToUpsert,
    { new: true, upsert: true },
  ).lean()
  return game
}

export async function findGameSession(
  filter: FilterQuery<Hub88GameSession>,
): Promise<Hub88GameSession | null> {
  const doc = await Hub88GameSessionModel.findOne(filter)
  return doc
}

// TODO convert to TTL index
export async function cleanupOldGames() {
  await cleanupOldTableMongo<Hub88GameSession>(
    'hub88_game_sessions',
    moment().subtract(3, 'days'),
    'updatedAt',
    0,
    {
      finished: true,
    },
  )
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: Hub88GameSessionModel.collection.name,
  cleanup: [cleanupOldGames],
}
