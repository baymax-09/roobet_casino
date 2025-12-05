import { type DBCollectionSchema } from 'src/modules'
import { megaloMongo } from 'src/system'

import { type Action, type Label } from '../types'

interface SeonTransaction {
  userId: string
  seonId: string
  type: Action
  internalId: string
  label?: Label
  createdAt?: Date
  updatedAt?: Date
}

const SeonTransactionSchema = new megaloMongo.Schema<SeonTransaction>(
  {
    userId: { type: String, index: true },
    seonId: { type: String, index: true },
    internalId: { type: String, index: true },
    type: String,
    label: String,
    /** We only care about these records until they have been finalized -- completed or cancelled */
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 30,
    },
  },
  { timestamps: true },
)

const SeonTransactionModel = megaloMongo.model<SeonTransaction>(
  'seon_transactions',
  SeonTransactionSchema,
)

export async function getSeonTransactionBySeonId(seonId: string) {
  return await SeonTransactionModel.findOne({ seonId })
}

export async function getSeonTransactionByInternalId(internalId: string) {
  return await SeonTransactionModel.findOne({ internalId })
}

export async function recordSeonTransaction(payload: SeonTransaction) {
  await SeonTransactionModel.create(payload)
}

export async function updateTransactionLabel(id: string, label: Label) {
  await SeonTransactionModel.findOneAndUpdate({ internalId: id }, { label })
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: SeonTransactionModel.collection.name,
}
