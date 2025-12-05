import { runWorker } from 'src/util/workerRunner'
import { tableChangeFeedCallback } from 'src/util/rethink'

import { currentRain, type Rain } from '../documents/rain'
import { runRain } from '../lib/rainProcess'
import { rainLogger } from '../lib/logger'

async function start() {
  const logger = rainLogger('start', { userId: null })
  const rain = await currentRain()
  logger.info(`current rain: ${rain}`, { rain })
  if (rain) {
    logger.info(`resuming previous rain at status: ${rain.status}`, { rain })
    await runRain(rain)
  }
  logger.info('called start', { rain })
  await tableChangeFeedCallback<Rain>(
    'rains',
    true,
    async ({ new_val: rain }) => {
      await runRain(rain)
    },
  )
}

export async function run() {
  runWorker('rain', start)
}
