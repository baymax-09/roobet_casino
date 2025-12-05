import { type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

export interface TronBlock {
  _id: Types.ObjectId
  height: number
  hash: string
  processed: boolean
  createdAt: Date
}

const BlockSchema = new mongoose.Schema<TronBlock>(
  {
    height: {
      type: Number,
      /** TRON became its own network starting at this block */
      min: 32570,
      index: true,
      unique: true,
      required: true,
    },
    hash: {
      type: String,
      unique: true,
      required: true,
    },
    processed: {
      type: Boolean,
      default: false,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 60 * 60 * 24 * 7,
    },
  },
  { timestamps: true },
)

const TronBlockModel = mongoose.model<TronBlock>('tron_blocks', BlockSchema)

export async function getLastBlock(): Promise<TronBlock | undefined> {
  const [block] = await TronBlockModel.find({})
    .sort({ height: -1 })
    .limit(1)
    .lean()
  return block
}

export async function getLatestProcessedBlock(): Promise<
  TronBlock | undefined
> {
  const [block] = await TronBlockModel.find({ processed: true })
    .sort({ height: -1 })
    .limit(1)
    .lean()
  return block
}

export async function createTronBlock(
  height: number,
  hash: string,
): Promise<TronBlock> {
  return await TronBlockModel.create({
    height,
    hash,
  })
}

export async function markBlockAsProcessed(height: number) {
  return await TronBlockModel.findOneAndUpdate(
    {
      height,
    },
    {
      processed: true,
    },
    {
      new: true,
    },
  )
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: TronBlockModel.collection.name,
}
