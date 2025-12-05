import { scopedLogger } from 'src/system/logger'
import { runWorker } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'

import { TronPoolingConfig } from '../tron/lib/pooling/poolingMain'

const poolingLogger = scopedLogger('cryptoPooling')
const WORKER = 'cryptoPooling'
const POOLING_SLEEP_SECONDS = 60 * 10

const CryptoPoolingHandlers = [TronPoolingConfig]

export function run() {
  const logger = poolingLogger('run', { userId: null })
  runWorker(WORKER, start).catch(error => {
    logger.error(`${WORKER} - error`, {}, error)
  })
}

async function sleepAndRestartWorker(): Promise<void> {
  // Sleep for the specified amount of time, then try again
  await sleep(1000 * POOLING_SLEEP_SECONDS)
  await start()
}

async function start(): Promise<void> {
  const logger = poolingLogger('start', { userId: null })
  for (const config of CryptoPoolingHandlers) {
    const { tokensToPool, poolTokens } = config.hooks
    const tokens = await tokensToPool()
    const response = await poolTokens(tokens)

    if (response.success) {
      logger.info('Pooled tokens successfully', {
        network: config.network,
        tokens,
      })
    } else {
      logger.error(
        'Failed to pool tokens',
        { network: config.network },
        response.error,
      )
    }
  }

  await sleepAndRestartWorker()
}
