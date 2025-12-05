import { type FilterQuery } from 'mongoose'

import { mongoose } from 'src/system'
import { scopedLogger } from 'src/system/logger'

/**
 * @deprecated use TTL index instead
 */
export async function cleanupOldTableMongo<T>(
  tableName: string,
  maxTimestamp: any, // TODO all callers of this function pass in a moment object
  index: string,
  minRecords = 0,
  filter: FilterQuery<T> = {},
) {
  const { deletedCount } = await mongoose.model<T>(tableName).deleteMany(
    {
      ...filter,
      [index]: {
        $gte: new Date(0),
        $lte: new Date(maxTimestamp),
      },
    },
    {
      skip: minRecords,
    },
  )
  scopedLogger('util/mongo')('cleanupOldTableMongo', { userId: null }).info(
    `[cleanup] - Removed ${deletedCount} ${tableName} records - mongodb`,
  )
}
