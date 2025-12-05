import moment from 'moment'

import { r } from 'src/system'
import { cleanupOldTableLeavingMinimumPerUser } from 'src/util/rethink'
import { APIValidationError } from 'src/util/errors'
import { createUniqueID } from 'src/util/helpers/id'
import { type DBCollectionSchema } from 'src/modules'
import { scopedLogger } from 'src/system/logger'

export interface NamedLock {
  id: string
  timestamp: Date
}

const MUTEX_TABLE_NAME = 'named_mutex'
const NamedLockModel = r.table<NamedLock>(MUTEX_TABLE_NAME)

/**
 * @deprecated use MutexLock instead.
 */
async function isLocked(keyList: string[], millisecondsExpiry = 2000) {
  const id = createUniqueID(keyList)
  const lock = await NamedLockModel.get(id).run()
  if (!lock) {
    return false
  }
  try {
    checkLockTimestamp(lock, null, millisecondsExpiry)
    return false
  } catch (error) {
    scopedLogger('named-lock')('isLocked', { userId: null }).error(
      'error',
      { keyList },
      error,
    )
    return true
  }
}

/**
 * @deprecated use MutexLock instead.
 */
export async function deleteLock(keyList: string[]) {
  const id = createUniqueID(keyList)
  await NamedLockModel.get(id).delete().run()
}

/**
 * @deprecated use MutexLock instead.
 * Use this if you don't want the behavior where someone gets locked out every time
 * the function is run before cooldown.
 * this is probably the default behavior you want
 */
export async function acquireLockWithoutLockout(
  keyList: string[],
  millisecondsExpiry: number,
) {
  const alreadyLocked = await isLocked(keyList, millisecondsExpiry)
  if (alreadyLocked) {
    throw new APIValidationError('slow_down')
  }
  await acquireLock(keyList, millisecondsExpiry)
}

/**
 * @deprecated use MutexLock instead.
 */
export async function renewLeaseOnLock(keyList: string[]) {
  const id = createUniqueID(keyList)
  return await NamedLockModel.get(id)
    .replace({ id, timestamp: r.now() }, { returnChanges: true })
    .run()
}

/**
 * @deprecated use MutexLock instead.
 */
export async function acquireLock(
  keyList: string[],
  millisecondsExpiry: number,
) {
  const id = createUniqueID(keyList)
  const result = await NamedLockModel.get(id)
    .replace({ id, timestamp: r.now() }, { returnChanges: true })
    .run()

  /*
   * in the case when result.unchanged = 1, changes.length == 0, this means the replace didn't work.
   * this happens when someone is spamming the mutex.
   */
  if (result.changes.length === 0 || result.unchanged) {
    throw new APIValidationError('slow_down')
  }
  const oldLock =
    result && result.changes && result.changes.length
      ? result.changes[0].old_val
      : null
  if (!oldLock) {
    return result
  }

  const newLock = result.changes[0].new_val
  checkLockTimestamp(oldLock, newLock, millisecondsExpiry)

  return result
}

/**
 * @deprecated use MutexLock instead.
 */
function checkLockTimestamp(
  lock: NamedLock,
  newLock: NamedLock | null,
  millisecondsExpiry: number,
) {
  const futureTs = moment(lock.timestamp).add(
    millisecondsExpiry,
    'milliseconds',
  )
  const newLockTs = newLock ? moment(newLock.timestamp) : moment()
  if (futureTs > newLockTs) {
    throw new APIValidationError('slow_down')
  }
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: MUTEX_TABLE_NAME,
  indices: [{ name: 'timestamp' }],
  cleanup: [
    async () => {
      await cleanupOldTableLeavingMinimumPerUser(
        MUTEX_TABLE_NAME,
        r.now().sub(60 * 30),
        'timestamp',
        'userId',
        250,
      )
    },
  ],
}
