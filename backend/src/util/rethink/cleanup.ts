import { type R_DeleteResult } from 'rethinkdbdash'

import { r } from 'src/system'
import { scopedLogger } from 'src/system/logger'

export async function cleanupOldTable(
  tableName: string,
  maxTimestamp: unknown,
  index: string,
  minRecords = 0,
  filter = {},
) {
  await r
    .table(tableName)
    .between(r.minval, maxTimestamp, { index })
    .filter(filter)
    .skip(minRecords)
    .limit(10000)
    .delete()
    .run()
    .then((result: R_DeleteResult) => {
      scopedLogger('util/rethink')('cleanupOldTable', { userId: null }).info(
        `[cleanup] - Removed ${result.deleted} ${tableName} records`,
      )
    })
}

/**
 * @todo re-implement this or delete this
 */
export async function cleanupOldTableLeavingMinimumPerUser(
  tableName: string,
  maxTimestamp: unknown,
  index: string,
  userColumnName: string,
  minimumAmount: number,
) {
  await cleanupOldTable(tableName, maxTimestamp, index)
}
