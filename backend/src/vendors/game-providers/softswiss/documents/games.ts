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

export interface SFGame {
  game_id: string
  game: string
  userId: string
  betAmount: number
  payAmount: number
  currency: DisplayCurrency
  finished: boolean
  balanceType: BalanceType
  createdAt: Date
}

const SFGameSchema = new mongoose.Schema<SFGame>(
  {
    game_id: { type: String, index: true },
    game: String,
    userId: { type: String, index: true },
    betAmount: Number,
    payAmount: Number,
    currency: String,
    finished: Boolean,
    balanceType: String,
  },
  { timestamps: true },
)

SFGameSchema.index({ createdAt: 1 })

const SFGameModel = mongoose.model<SFGame>('sf_games', SFGameSchema)

export async function unfinishedSoftswissGames({
  userId,
  sinceTimestamp,
}: {
  userId: string
  sinceTimestamp: string
}) {
  return await SFGameModel.find({
    userId,
    finished: { $ne: true },
    createdAt: {
      $gte: sinceTimestamp,
    },
  })
}

export async function updateGame(
  filter: FilterQuery<SFGame>,
  payload: UpdateQuery<SFGame> | UpdateWithAggregationPipeline,
  createPayload: UpdateQuery<SFGame> | UpdateWithAggregationPipeline = {},
) {
  const exists = await SFGameModel.findOne(filter)
  const gameToUpsert = exists ? payload : { ...payload, ...createPayload }
  const game = await SFGameModel.findOneAndUpdate(filter, gameToUpsert, {
    new: true,
    upsert: true,
  })
  return game
}

export async function findGame(filter: FilterQuery<SFGame>) {
  const doc = await SFGameModel.findOne(filter)
  return doc
}

export async function cleanupOldGames() {
  await cleanupOldTableMongo<SFGame>(
    'sf_games',
    moment().subtract(1, 'hours'),
    'updatedAt',
    0,
    { finished: true },
  )
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: 'sf_games',
  cleanup: [cleanupOldGames],
}
