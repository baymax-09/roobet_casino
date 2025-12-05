import { type R_InsertResult } from 'rethinkdbdash'

import { type DBCollectionSchema } from 'src/modules'
import { r } from 'src/system'
import { sleep } from 'src/util/helpers/timer'
import { hotboxLogger } from '../lib/logger'

export interface IHotboxHash {
  hash: string
  id: string
  index: number
  previousHash: string
}

/**
 * Do not use my exported value outside of this file. Please do not follow this pattern.
 */
export const HotboxHashModel = r.table<IHotboxHash>('hotbox_hashes')

export async function insertHashBatch(batch: IHotboxHash[]) {
  const logger = hotboxLogger('', { userId: null })
  let result: R_InsertResult | null = null
  do {
    logger.info(
      `committing batch from ${batch[0].index} to ${
        batch[batch.length - 1].index
      }`,
      { batchStart: batch[0].index, batchEnd: batch[batch.length - 1].index },
    )
    try {
      result = await HotboxHashModel.insert(batch).run()
    } catch (error) {
      logger.error(`error inserting hashes, trying again`, {}, error)
      await sleep(2000)
    }
  } while (!result || result.inserted === 0)
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'hotbox_hashes',
  indices: [{ name: 'index' }, { name: 'hash' }],
}
