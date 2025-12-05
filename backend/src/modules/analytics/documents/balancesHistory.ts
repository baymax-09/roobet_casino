import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { analyticsLogger } from '../lib/logger'

// For now, these interfaces are identical.
type BalancesHistory = Record<string, unknown>

// We are not keeping a strict schema for this collection.
const BalancesHistorySchema = new megaloMongo.Schema<BalancesHistory>(
  {},
  { strict: false, timestamps: { createdAt: true, updatedAt: false } },
)

// Since this data is not read by the application, expire docs after a week.
BalancesHistorySchema.index({ createdAt: 1 }, { expires: '7d' })

const BalancesHistoryModel = megaloMongo.model<BalancesHistory>(
  'balances_history',
  BalancesHistorySchema,
  'balances_history',
)

export const safelyRecordBalancesHistory = async (
  document: Partial<BalancesHistory>,
): Promise<void> => {
  try {
    await BalancesHistoryModel.create(document)
  } catch (error) {
    analyticsLogger('safelyRecordBalancesHistory', { userId: null }).error(
      'failed to write to balances history collection',
      error,
    )
  }
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: BalancesHistoryModel.collection.name,
}
