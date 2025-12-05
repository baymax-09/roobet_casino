import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'

export interface PolygonBlock {
  height: number
  hash?: string
  createdAt?: Date
  updatedAt?: Date
}

const PolygonBlockSchema = new mongoose.Schema<PolygonBlock>(
  {
    height: {
      required: true,
      type: Number,
      index: true,
      unique: true,
    },
    hash: String,
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 60 * 60 * 24 * 3,
    },
  },
  { timestamps: true },
)

const PolygonBlockModel = mongoose.model<PolygonBlock>(
  'polygon_blocks',
  PolygonBlockSchema,
)

export async function getLatestBlock(): Promise<PolygonBlock | null> {
  const [block] = await PolygonBlockModel.find({})
    .sort({ height: -1 })
    .limit(1)
    .lean()

  return block
}

export async function getPolygonBlock(
  blockId: number,
): Promise<PolygonBlock | null> {
  return await PolygonBlockModel.findOne({ height: blockId }).lean()
}

export async function createPolygonBlock(
  blockNumber: number,
  blockHash: string,
) {
  const toInsert = {
    height: blockNumber,
    hash: blockHash,
  }

  return await PolygonBlockModel.create(toInsert)
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: PolygonBlockModel.collection.name,
}
