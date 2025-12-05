import moment from 'moment'
import {
  type FilterQuery,
  type UpdateWithAggregationPipeline,
  type UpdateQuery,
} from 'mongoose'

import { mongoose } from 'src/system'
import { cleanupOldTableMongo } from 'src/util/mongo'
import { type DBCollectionSchema } from 'src/modules'
import { type BalanceType } from 'src/modules/user/types'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'

export interface PNGGameRound {
  _id: string
  roundId: string
  gameSessionId: string
  gameId: string
  userId: string
  finished: boolean
  betAmount: number
  payAmount: number
  currency: DisplayCurrency
  balanceType: BalanceType
  createdAt: Date
}

const PNGGameRoundSchema = new mongoose.Schema<PNGGameRound>(
  {
    roundId: { type: String, unique: true, index: true },
    gameSessionId: { type: String, index: true },
    gameId: String,
    userId: { type: String, index: true },
    finished: Boolean,
    betAmount: Number,
    payAmount: Number,
    currency: String,
    balanceType: String,
    createdAt: { type: Date, default: Date.now, index: true, expires: '3d' },
  },
  { timestamps: true },
)

PNGGameRoundSchema.index({ finished: 1, updatedAt: 1 })

const PNGGameRoundModel = mongoose.model<PNGGameRound>(
  'png_game_rounds',
  PNGGameRoundSchema,
)

export async function unfinishedPNGGames({
  userId,
  sinceTimestamp,
}: {
  userId: string
  sinceTimestamp: string
}) {
  return await PNGGameRoundModel.find({
    userId,
    finished: { $ne: true },
    createdAt: {
      $gte: sinceTimestamp,
    },
  })
}

export async function updateGameRound(
  filter: FilterQuery<PNGGameRound>,
  payload: UpdateQuery<PNGGameRound> | UpdateWithAggregationPipeline,
  createPayload: UpdateQuery<PNGGameRound> | UpdateWithAggregationPipeline = {},
): Promise<PNGGameRound> {
  const exists = await PNGGameRoundModel.findOne(filter)
  const gameRoundToUpsert = exists ? payload : { ...payload, ...createPayload }
  const game = await PNGGameRoundModel.findOneAndUpdate(
    filter,
    gameRoundToUpsert,
    { new: true, upsert: true },
  ).lean()
  return game
}

export async function getGameRoundByRoundId(
  roundId: string,
): Promise<PNGGameRound | null> {
  const game = await PNGGameRoundModel.findOne({ roundId })
  return game
}

export async function finishGameSession(gameSessionId: string) {
  await PNGGameRoundModel.updateMany({ gameSessionId }, { finished: true })
}

export async function cleanupOldGames(): Promise<void> {
  await cleanupOldTableMongo<PNGGameRound>(
    'png_game_rounds',
    moment().subtract(1, 'hours'),
    'updatedAt',
    0,
    {
      finished: true,
    },
  )
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: PNGGameRoundModel.collection.name,
  cleanup: [cleanupOldGames],
}
