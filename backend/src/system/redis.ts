import RedisLib, {
  type RetryStrategyOptions,
  type ClientOpts,
  type RedisClient,
  type Multi,
} from 'redis'
import bluebird from 'bluebird'

import { config } from './config'
import { scopedLogger } from './logger'

bluebird.promisifyAll<RedisClient>(RedisLib.RedisClient.prototype)
bluebird.promisifyAll<Multi>(RedisLib.Multi.prototype)

const RedisClientTypes = ['primary', 'secondary', 'cache', 'sockets'] as const
type RedisClientType = (typeof RedisClientTypes)[number]
/**
 * Factory for client connections, currently a singleton
 */
const clients: Record<RedisClientType, RedisClient | null> = {
  primary: null, // sessions - o.g. redis sentinel, needs to be migrated
  secondary: null, // sessions secondary
  cache: null, // elasticache cluster
  sockets: null, // elasticache sentinel (sockets don't scale with cluster)
}

const redisLogger = scopedLogger('system/redis')

const getOptions = (
  type: RedisClientType = 'primary',
): Partial<ClientOpts | undefined> => {
  const clientConfig = config.redis[type]

  const hostInfo = (() => {
    if ('url' in clientConfig && clientConfig.url) {
      return {
        url: clientConfig.url,
      }
    }

    if (
      'host' in clientConfig &&
      'port' in clientConfig &&
      clientConfig.host &&
      clientConfig.port
    ) {
      return {
        host: clientConfig.host,
        port: clientConfig.port,
      }
    }

    return undefined
  })()

  if (!hostInfo) {
    return undefined
  }

  const tls = 'tls' in clientConfig ? { tls: clientConfig.tls } : {}

  return {
    ...hostInfo,
    ...tls,
    auth_pass: clientConfig.pass,

    retry_strategy: (options: RetryStrategyOptions) => {
      const { pass, ...debugConfig } = clientConfig
      redisLogger('retry_strategy', { userId: null }).debug(
        'Redis reconnecting',
        { debugConfig, options },
      )
      const client = clients[type]
      if (client !== null && !client.connected) {
        clients[type] = null
      }
      if (options.error && options.error.code === 'ECONNREFUSED') {
        clients[type] = null
      }

      /*
       * Kubernetes crash-loop backoff interval resets after 10 minutes, so that's what we target here to avoid extra
       * downtime.
       */
      if (options.total_retry_time > 1000 * 60 * 10) {
        return new Error('Retry Time Exhausted')
      }

      // Wait <= 3 seconds between retry attempts
      return Math.min(options.attempt * 100, 3000)
    },
  }
}

const createClient = (options: ClientOpts): RedisClient => {
  const newClient = RedisLib.createClient(options)

  newClient.on('error', err => {
    redisLogger('createClient', { userId: null }).error(
      'Redis client error',
      {},
      err,
    )
  })

  return newClient
}

const getClient = (type: RedisClientType): RedisClient => {
  const client = clients[type]

  // If a client doesn't exist or is not connected, create new instance.
  if (client === null || !client.connected) {
    const options = getOptions(type)

    // If options is undefined, attempt to connect with default config.
    const newClient = createClient(options ?? {})

    // Update reference in client map for accessing later.
    clients[type] = newClient

    return newClient
  }

  return client
}

const getOptionalClient = (type: RedisClientType): RedisClient | null => {
  const client = clients[type]

  // If a client doesn't exist or is not connected, create new instance.
  if (client === null || !client.connected) {
    const options = getOptions(type)

    // If options is undefined, do not attempt to instantiate client.
    if (!options) {
      return null
    }

    const newClient = createClient(options ?? {})

    // Update reference in client map for accessing later.
    clients[type] = newClient

    return newClient
  }

  return client
}

export const redis = getClient('primary')
export const redisSecondary = getOptionalClient('secondary')
export const redisCache = getClient('cache')
export const socketsRedis = getClient('sockets')

export const cacheClient = () => getClient('cache')
export const primaryClient = () => getClient('primary')
export const socketsClient = () => getClient('sockets')

export async function redisHealthCheck() {
  try {
    const redisStatus = {
      cache: (await redisCache.pingAsync()) === 'PONG',
      primary: (await redis.pingAsync()) === 'PONG',
      sockets: (await socketsRedis.pingAsync()) === 'PONG',
    }
    return redisStatus
  } catch (error) {
    if (error instanceof Error && 'message' in error) {
      return { redisHealth: error.message }
    } else {
      return { redisHealthCheck: false }
    }
  }
}
