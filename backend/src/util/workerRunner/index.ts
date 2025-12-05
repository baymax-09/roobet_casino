import { config } from 'src/system'
import { scopedLogger } from 'src/system/logger'
import { sleep } from 'src/util/helpers/timer'
import { instrument } from 'src/util/trace'
import * as NamedLock from 'src/util/named-lock'
import { type LockInstance } from '../named-lock/lib/lock'
import { addTimeInDuration, isAfter } from '../helpers/time'

const workerLogger = scopedLogger('workerRunner')

/**
 * Run a handler every X seconds. The handler is responsible
 * for catching all errors and rejections as the handler isn't awaited.
 *
 * @param interval number of seconds
 * @param runner handler to run on each interval
 */
export async function runOnInterval(
  interval: number,
  runner: () => Promise<void>,
) {
  // Do not await runner so the interval is exact.
  runner()

  // Sleep the specified # of seconds.
  await sleep(interval * 1000)

  // Recursively run the interval again.
  await runOnInterval(interval, runner)
}

export async function runJob(
  workerName: string,
  workerFunction: () => Promise<void>,
) {
  const logger = workerLogger('runJob', { userId: null })
  try {
    logger.info('running job', { workerName })
    await workerFunction()
  } catch (error) {
    logger.error('Job error', { workerName }, error)
  }
}

const ACQUIRE_INTERVAL_MS = config.workerTiming.acquireIntervalSeconds * 1000
const WORKER_LEASE_DURATION_MS =
  config.workerTiming.workerLeaseDurationSeconds * 1000

/**
 * Blocks the process from running the worker function until the lock is acquired.
 */
const waitForLease = async (
  workerName: string,
): Promise<LockInstance | undefined> => {
  const worker = 'w-' + workerName.toLowerCase()
  const logger = workerLogger('waitForLease', { userId: null })
  const failAt = addTimeInDuration(
    config.workerTiming.availabilityDelaySeconds,
    's',
    new Date(),
  )

  do {
    const lock = await instrument('worker.lock', worker, async () => {
      logger.info('attempting to acquire lock')
      const lock = await NamedLock.MutexLock.acquireLock(
        'workerLock',
        workerName,
        '',
        WORKER_LEASE_DURATION_MS,
      )
      return lock
    })

    if (!lock) {
      if (isAfter(new Date(), failAt)) {
        global.DEPLOYMENT_UNAVAILABLE = {
          reason: `worker has failed to acquire mutex lock within ${config.workerTiming.availabilityDelaySeconds} seconds`,
        }
        logger.info('reached maximum attempts')
        return
      }
      await sleep(ACQUIRE_INTERVAL_MS)
      continue
    }

    logger.info('lock acquired')
    return lock
  } while (true)
}

/**
 * Keeps the lease on the lock alive until on an internal.
 */
const startRenewInterval = (lock: LockInstance, workerName: string) => {
  const worker = 'w-' + workerName.toLowerCase()

  setInterval(() => {
    ;(async () => {
      await instrument('worker.lockRenew', worker, async () => {
        const renewal = await lock.renew(WORKER_LEASE_DURATION_MS)
        if (!renewal) {
          global.DEPLOYMENT_UNAVAILABLE = {
            reason: `worker has failed to renew mutex lock`,
          }
        }
      })
    })().catch(error => {
      workerLogger('startRenewInterval', { userId: null }).error(
        'failed to renew lease',
        { worker },
        error,
      )
      global.DEPLOYMENT_UNAVAILABLE = {
        reason: `worker ran into error when renewing mutex lock`,
      }
    })
  }, ACQUIRE_INTERVAL_MS)
}

export async function runWorker(
  workerName: string,
  workerFunction: () => Promise<void>,
  idempotentProcess: boolean = true,
) {
  if (idempotentProcess) {
    const lock = await waitForLease(workerName)

    if (!lock) {
      return
    }

    startRenewInterval(lock, workerName)
  }

  await workerFunction()
}

export function safeToShutdown() {
  if (global.SHUTTING_DOWN) {
    workerLogger('safeToShutdown', { userId: null }).info(
      'Safe to shut down. Exiting.',
    )
    process.exit(0)
  }
}
