import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'
import { type FreespinIssuer } from 'src/modules/tp-games'

export interface BaseHacksawFreespin {
  gameId: string
  issuerId: FreespinIssuer
  expiry?: Date
  gameIds: string[]
  userId: string
  totalAmount: number
  quantity: number
  betLevel: number
  reason: string
}

export interface HacksawFreespin extends BaseHacksawFreespin {
  createdAt: Date
  updatedAt: Date
}

const HacksawFreespinsSchema = new mongoose.Schema<HacksawFreespin>(
  {
    gameId: { type: String, index: true },
    userId: { type: String, index: true },
    issuerId: String,
    gameIds: Array,
    expiry: { type: Date, default: null },
    totalAmount: Number,
    quantity: Number,
    betLevel: Number,
    reason: String,
  },
  { timestamps: true },
)

export const HacksawFreespinsModel = mongoose.model<HacksawFreespin>(
  'hacksaw_freespins',
  HacksawFreespinsSchema,
)

export async function createFreespin(payload: BaseHacksawFreespin) {
  return await HacksawFreespinsModel.create(payload)
}

export async function deleteFreespin(id: string): Promise<void> {
  await HacksawFreespinsModel.findByIdAndDelete(id)
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: HacksawFreespinsModel.collection.name,
}
