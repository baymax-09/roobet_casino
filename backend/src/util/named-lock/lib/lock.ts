import { createUniqueID } from 'src/util/helpers/id'

import {
  createLock,
  deleteLock,
  renewLock,
} from '../documents/named_lock_mongo'

type AcquireLock = (
  principalId: string,
  namespace: string,
  resource: string,
  expiresInMS: number,
) => Promise<Lock | null>

interface Mutex {
  acquireLock: AcquireLock
}

class Lock {
  constructor(private readonly clientId: string) {}

  release = async (): Promise<void> => {
    await deleteLock(this.clientId)
  }

  renew = async (expiresInMS: number): Promise<string | null> => {
    return await renewLock(this.clientId, expiresInMS)
  }
}

export type LockInstance = InstanceType<typeof Lock>

export const MutexLock: Mutex = {
  acquireLock: async function (principalId, namespace, resource, expiresInMS) {
    if (Math.floor(expiresInMS) !== expiresInMS) {
      throw new Error('Duration must be an integer value in milliseconds.')
    }

    const keyList = [principalId, namespace, resource]
    const lockId = createUniqueID(keyList)

    const id = await createLock(lockId, expiresInMS)
    if (id) {
      return new Lock(id)
    }

    return null
  },
}
