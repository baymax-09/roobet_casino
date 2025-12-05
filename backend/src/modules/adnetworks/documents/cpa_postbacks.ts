import { type UpdatePayload, type FilterQuery } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

interface CPAPostback {
  transactionId: string
  transactionSource: string
  subId: string
  ipAddress: string
  userId: string
}

const CPAPostbacksSchema = new mongoose.Schema<CPAPostback>(
  {
    transactionId: String,
    transactionSource: String,
    subId: String,
    ipAddress: String,
    userId: String,
  },
  { timestamps: true },
)

const CPAPostbacksModel = mongoose.model<CPAPostback>(
  'cpa_postbacks',
  CPAPostbacksSchema,
)

export async function addPostback(
  filter: FilterQuery<CPAPostback>,
  payload: UpdatePayload<CPAPostback>,
) {
  await CPAPostbacksModel.findOneAndUpdate(filter, payload, {
    new: true,
    upsert: true,
  })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: CPAPostbacksModel.collection.name,
}
