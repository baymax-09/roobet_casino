import { config } from 'src/system'
import { runJob, runWorker } from 'src/util/workerRunner'
import { type DBCleanupFunction, loadCleanups } from 'src/modules'
import { sleep } from 'src/util/helpers/timer'

import { dbLogger } from './logger'

/*
 * FYI - there are two types of timestamp columns in rethinkdb
 * some of them use moment() when they're created - for example: moment().subtract(1, 'month').toISOString()
 * Other timestamps are created using r.now() - which is the rethinkdb native time type.
 * You MUST query each table based on the type of timestamps they use. To see what type of timestamp a table uses
 * look at the functions that `insert` into the table! `moment` is legacy - its best to  use RethinkDB's native time
 * type.
 */

async function cleanup() {
  const cleanups: DBCleanupFunction[] = loadCleanups('cleanup')
  dbLogger('cleanup', { userId: null }).info('Running normal cleanup scripts', {
    numberOfScripts: cleanups.length,
  })
  for (const cleanupScript of cleanups) {
    await cleanupScript()
  }
}

// async function bigCleanups() {
//   const cleanups: Array<DBCleanupFunction> = loadCleanups('bigCleanups')
//   winston.info('Running', cleanups.length, 'big cleanup scripts')
//   for (const cleanupScript of cleanups) {
//     await cleanupScript()
//   }
//   await sleep(60 * 1000 * 60 * 12)
//   await bigCleanups()
// }

async function startJob(): Promise<void> {
  await cleanup()
  // bigCleanups()
}

async function start(): Promise<void> {
  while (true) {
    await startJob()
    await sleep(1000 * 60 * 30) // 30 minutes
  }
}

export async function run() {
  if (config.oneshot) {
    runJob('cleanup', startJob)
  } else {
    runWorker('cleanup', start)
  }
}
