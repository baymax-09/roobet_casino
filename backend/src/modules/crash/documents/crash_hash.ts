import { type R_InsertResult } from 'rethinkdbdash'

import { type DBCollectionSchema } from 'src/modules'
import { r } from 'src/system'
import { type ScopedLogger } from 'src/system/logger'
import { sleep } from 'src/util/helpers/timer'
import { crashLogger } from '../lib/logger'

export interface ICrashHash {
  hash: string
  id: string
  index: number
  previousHash: string
}

/**
 * Do not use my exported value outside of this file. Please do not follow this pattern.
 */
export const CrashHashModel = r.table<ICrashHash>('crash_hashes')

export async function insertHashBatch(batch: ICrashHash[]) {
  const logger: ScopedLogger = crashLogger('insertHashBatch', { userId: null })
  let result: R_InsertResult | null = null
  do {
    logger.info(
      `committing batch from ${batch[0].index} to ${
        batch[batch.length - 1].index
      }`,
      {
        batchFrom: batch[0].index,
        batchTo: batch[batch.length - 1].index,
      },
    )
    try {
      result = await CrashHashModel.insert(batch).run()
    } catch (error) {
      logger.error('error inserting hashes, trying again', {}, error)
      await sleep(2000)
    }
  } while (!result || result.inserted === 0)
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'crash_hashes',
  indices: [{ name: 'index' }, { name: 'hash' }],
}
