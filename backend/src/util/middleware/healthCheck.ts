import { type RequestHandler } from 'express'
import {
  rabbitMQHealthCheck,
  rethinkHealthCheck,
  redisHealthCheck,
  mongoHealthCheck,
} from 'src/system'
import { scopedLogger } from 'src/system/logger'

const healthCheckLogger = scopedLogger('healthcheck')

const getSystemStatus = async () => {
  return await Promise.allSettled([
    mongoHealthCheck(),
    redisHealthCheck(),
    rethinkHealthCheck(),
    rabbitMQHealthCheck(),
  ])
}

const healthCheck = async (): Promise<boolean> => {
  const logger = healthCheckLogger('healthCheck', { userId: null })
  if (global.DEPLOYMENT_UNAVAILABLE) {
    logger.error('System is unhealthy', {
      unavailable: global.DEPLOYMENT_UNAVAILABLE,
    })
    return false
  }

  const systemStatus = await getSystemStatus()

  const healthMap = systemStatus.map(system => {
    if (system.status === 'fulfilled') {
      return system.value
    } else {
      return system.reason
    }
  })

  const hasFailures = healthMap.some(result => {
    return Object.values(result).some(val => !val)
  })

  if (hasFailures) {
    logger.error('System is unhealthy', healthMap)
    return false
  }

  return true
}

export const healthCheckRequestHandler: RequestHandler = (_, res) => {
  healthCheck()
    .then(healthy => {
      if (healthy) {
        res.status(200).send({ healthy: true })
      } else {
        res.status(500).send({ healthy: false })
      }
    })
    .catch(err => {
      healthCheckLogger('healthCheckRequestHandler', { userId: null }).error(
        'Health check error',
        {},
        err,
      )
      res.status(500).send({ healthy: false })
    })
}
