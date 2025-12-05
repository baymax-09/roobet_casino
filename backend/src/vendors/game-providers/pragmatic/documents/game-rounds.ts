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

export interface PragmaticGameRound {
  gameSessionId: string
  gameId: string
  userId: string
  finished: boolean
  betAmount: number
  payAmount: number
  currency: DisplayCurrency
  balanceType: BalanceType
  createdAt: Date
  updatedAt: Date
}

const PragmaticGameRoundSchema = new mongoose.Schema<PragmaticGameRound>(
  {
    gameSessionId: { type: String, index: true },
    gameId: String,
    userId: { type: String, index: true },
    finished: Boolean,
    betAmount: Number,
    payAmount: Number,
    currency: String,
    balanceType: String,
  },
  { timestamps: true },
)

PragmaticGameRoundSchema.index({ createdAt: 1 })

const PragmaticGameRoundModel = mongoose.model<PragmaticGameRound>(
  'pragmatic_game_rounds',
  PragmaticGameRoundSchema,
)

export async function unfinishedPragmaticGames({
  userId,
  sinceTimestamp,
}: {
  userId: string
  sinceTimestamp: string
}): Promise<PragmaticGameRound[]> {
  return await PragmaticGameRoundModel.find({
    userId,
    finished: { $ne: true },
    createdAt: {
      $gte: sinceTimestamp,
    },
  })
}

export async function updateGameRound(
  filter: FilterQuery<PragmaticGameRound>,
  payload: UpdateQuery<PragmaticGameRound> | UpdateWithAggregationPipeline,
  createPayload:
    | UpdateQuery<PragmaticGameRound>
    | UpdateWithAggregationPipeline = {},
): Promise<PragmaticGameRound> {
  const exists = await PragmaticGameRoundModel.findOne(filter)
  const gameRoundToUpsert = exists ? payload : { ...payload, ...createPayload }
  const game = await PragmaticGameRoundModel.findOneAndUpdate(
    filter,
    gameRoundToUpsert,
    { new: true, upsert: true },
  ).lean()
  return game
}

export async function getGameRoundByGameSessionId(
  gameSessionId: string,
): Promise<PragmaticGameRound | null> {
  const game = await PragmaticGameRoundModel.findOne({ gameSessionId })
  return game
}

// TODO convert to TTL index
export async function cleanupOldGames() {
  await cleanupOldTableMongo<PragmaticGameRound>(
    'pragmatic_game_rounds',
    moment().subtract(12, 'hours'),
    'updatedAt',
    0,
    {
      finished: true,
    },
  )
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: PragmaticGameRoundModel.collection.name,
  cleanup: [cleanupOldGames],
}
