import { type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

export interface RippleLedger {
  _id: Types.ObjectId
  ledgerIndex: number
  hash: string
  createdAt: Date
}

const LedgerSchema = new mongoose.Schema<RippleLedger>(
  {
    ledgerIndex: {
      type: Number,
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
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 60 * 60 * 24 * 7,
    },
  },
  { timestamps: true },
)

const LedgerModel = mongoose.model<RippleLedger>('ripple_ledgers', LedgerSchema)

export async function getLastLedger(): Promise<RippleLedger | undefined> {
  const [ledger] = await LedgerModel.find({})
    .sort({ ledgerIndex: -1 })
    .limit(1)
    .lean()
  return ledger
}

export async function getLedger(
  ledgerIndex: number,
): Promise<RippleLedger | null> {
  return await LedgerModel.findOne({ ledgerIndex }).lean()
}

export async function createLedger(
  ledgerIndex: number,
  hash: string,
): Promise<void> {
  const toInsert = {
    ledgerIndex,
    hash,
  }

  await LedgerModel.create(toInsert)
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: LedgerModel.collection.name,
}
