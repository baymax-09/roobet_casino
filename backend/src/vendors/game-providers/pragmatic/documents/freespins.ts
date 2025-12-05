import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'
import { type FreespinIssuer } from 'src/modules/tp-games'

export interface PragmaticFreespin {
  gameId: string
  issuerId: FreespinIssuer
  expiry: Date
  gameIds: string[]
  userId: string
  totalAmount: number
  quantity: number
  betLevel: number
  reason: string
}

const PragmaticFreespinsSchema = new mongoose.Schema<PragmaticFreespin>(
  {
    gameId: { type: String, index: true },
    userId: { type: String, index: true },
    issuerId: String,
    gameIds: Array,
    expiry: Date,
    totalAmount: Number,
    quantity: Number,
    betLevel: Number,
    reason: String,
  },
  { timestamps: true },
)

export const PragmaticFreespinsModel = mongoose.model<PragmaticFreespin>(
  'pragmatic_freespins',
  PragmaticFreespinsSchema,
)

export async function createFreespins(payload: PragmaticFreespin) {
  return await PragmaticFreespinsModel.create(payload)
}

export async function deleteFreespins(id: string): Promise<void> {
  await PragmaticFreespinsModel.findByIdAndDelete(id)
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: PragmaticFreespinsModel.collection.name,
}
