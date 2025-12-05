import { type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

export interface BasePlinkoHash {
  hash: string
  index: number
  previousHash: string
}

export interface PlinkoHash extends BasePlinkoHash {
  id: string
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const PlinkoHashSchema = new mongoose.Schema<PlinkoHash>(
  {
    hash: String,
    index: Number,
    previousHash: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 30 * 1,
    },
  },
  { timestamps: true },
)

const PlinkoHashModel = mongoose.model<PlinkoHash>(
  'plinko_hashes',
  PlinkoHashSchema,
)

export async function insertPlinkoHashes(
  games: BasePlinkoHash[],
): Promise<PlinkoHash[]> {
  return await PlinkoHashModel.create(games)
}

export async function getPlinkoHashByIndex(
  gameIndex: string,
): Promise<PlinkoHash | null> {
  return await PlinkoHashModel.findOne({ index: gameIndex })
}

export async function getPlinkoHashCount(): Promise<number> {
  return await PlinkoHashModel.countDocuments({}).exec()
}

export async function getPlinkoHashMaxIndex() {
  return (await PlinkoHashModel.find().sort({ index: -1 }).limit(1)).pop()
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: PlinkoHashModel.collection.name,
}
