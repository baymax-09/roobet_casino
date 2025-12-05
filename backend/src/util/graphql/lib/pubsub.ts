import { RedisPubSub } from 'graphql-redis-subscriptions'
import IORedis from 'ioredis'

import { config } from 'src/system/config'

const redisConfig = config.redis.primary
const redisOptions = {
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  password: redisConfig.pass,
}

const makeIOInstance = () => {
  if ('url' in redisConfig) {
    return new IORedis(redisConfig.url, {
      ...redisOptions,
      ...(process.env.REDIS_UNSAFE_TLS
        ? {
            tls: {
              rejectUnauthorized: false,
            },
          }
        : {}),
    })
  }

  return new IORedis(redisConfig.port, redisConfig.host, redisOptions)
}

export const pubsub = new RedisPubSub({
  publisher: makeIOInstance(),
  subscriber: makeIOInstance(),
})
