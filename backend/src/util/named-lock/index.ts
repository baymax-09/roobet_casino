export * as Documents from './documents'

export {
  renewLeaseOnLock,
  acquireLockWithoutLockout,
  acquireLock,
  deleteLock,
} from './documents/named_lock'

export { MutexLock } from './lib/lock'
