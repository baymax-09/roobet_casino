import { config } from 'src/system'
import { loadWorkers } from 'src/modules'
import { setupLogger } from './lib/logger'

const initWorkers = () => {
  const logger = setupLogger('initWorkers', { userId: null })
  const moduleWorkers = loadWorkers()

  if (config.mode === 'dev' && !config.worker) {
    logger.info('Booting all workers for dev mode')
    for (const workerGroup of moduleWorkers) {
      for (const workerName in workerGroup) {
        if (workerName !== 'default') {
          workerGroup[workerName].run()
        }
      }
    }
  } else if (config.worker) {
    for (const workerGroup of moduleWorkers) {
      for (const workerName in workerGroup) {
        if (workerName === config.worker && workerName !== 'default') {
          logger.info(`Booting worker ${config.worker}`, {
            worker: config.worker,
          })
          workerGroup[workerName].run()
        }
      }
    }
  } else {
    logger.info('No workers to load!')
  }
}

initWorkers()
