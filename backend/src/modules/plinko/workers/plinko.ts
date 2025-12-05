import { buildGameHashTable } from 'src/modules/plinko/lib/pregenerated'
import { runWorker } from 'src/util/workerRunner'

async function start() {
  await buildGameHashTable()
}

export async function run() {
  runWorker('plinko', start)
}
