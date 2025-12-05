import {
  type FilterQuery,
  type UpdateWithAggregationPipeline,
  type UpdateQuery,
  type Types,
} from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'
import { type FreespinIssuer } from 'src/modules/tp-games'

interface SFFreespin {
  game_id: string
  issue_id: string
  valid_until: string
  games: any[]
  userId: string
  total_amount: number
  status: string
  freespins_quantity: number
  bet_level: number
  issuer_id: FreespinIssuer
  reason: string
  createdAt: Date
  updatedAt: Date
}

const SFFreespinsSchema = new mongoose.Schema<SFFreespin>(
  {
    game_id: String,
    issue_id: String,
    valid_until: String,
    games: Array,
    userId: { type: String, index: true },
    total_amount: Number,
    status: { type: String, index: true },
    freespins_quantity: Number,
    bet_level: Number,
    issuer_id: String,
    reason: String,
  },
  { timestamps: true },
)

export const SFFreespinsModel = mongoose.model<SFFreespin>(
  'sf_freespins',
  SFFreespinsSchema,
)

export async function updateFreespins(
  filter: FilterQuery<SFFreespin>,
  payload: UpdateQuery<SFFreespin> | UpdateWithAggregationPipeline,
) {
  const doc = await SFFreespinsModel.findOneAndUpdate(filter, payload, {
    new: true,
    upsert: true,
  })
  return doc
}

export async function getFreespins(id: string) {
  const doc = await SFFreespinsModel.findById(id)
  return doc
}

export async function deleteFreespins(id: Types.ObjectId | string) {
  await SFFreespinsModel.findByIdAndDelete(id)
}

export async function getUnusedFreespinsByUserId(userId: string) {
  return await SFFreespinsModel.find({ userId, status: { $exists: false } })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: SFFreespinsModel.collection.name,
}
