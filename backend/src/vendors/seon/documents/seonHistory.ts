import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { type SeonResponseData } from 'src/vendors/seon/types'
import { seonLogger } from '../lib/logger'

// For now, these interfaces are identical.
type SeonHistory = SeonResponseData & {
  user_id: string
  seon_transaction_id: string
  createdAt: Date
  updatedAt: Date
}

// We are not keeping a strict schema for this collection.
const SeonHistorySchema = new megaloMongo.Schema<SeonHistory>(
  {},
  { timestamps: true, strict: false },
)

// Since this data is not read by the application, expire docs after a week.
SeonHistorySchema.index({ createdAt: 1 }, { expires: '7d' })

const SeonHistoryModel = megaloMongo.model<SeonHistory>(
  'seon_history',
  SeonHistorySchema,
  'seon_history',
)

export const safelyRecordSeonHistory = async (
  document: Partial<SeonHistory>,
): Promise<void> => {
  try {
    await SeonHistoryModel.create(document)
  } catch (error) {
    seonLogger('safelyRecordSeonHistory', { userId: null }).error(
      '[seonHistory] - failed to write to seon history collection',
      {},
      error,
    )
  }
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: SeonHistoryModel.collection.name,
}
