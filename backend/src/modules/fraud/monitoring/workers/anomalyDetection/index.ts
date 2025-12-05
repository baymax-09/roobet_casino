import { runWorker } from 'src/util/workerRunner'

import { startJob } from './job'

export async function run() {
  runWorker('anomalyDetection', startJob)
}
