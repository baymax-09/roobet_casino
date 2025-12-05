import { BasicCache } from 'src/util/redisModels'

type RaffleCacheKey = (typeof cacheKeys)[number]

export const REDIS_CACHE_NAME = 'rafflesv2'

const cacheKeys = ['activeList', 'list'] as const

export const cacheRaffleData = async <T>(
  key: RaffleCacheKey,
  exp: number,
  query: () => T,
): Promise<T> => {
  return await BasicCache.cached(REDIS_CACHE_NAME, key, exp, query)
}

export const bustAllRaffleCacheData = async () => {
  return await Promise.allSettled(
    cacheKeys.map(async key => {
      await BasicCache.invalidate(REDIS_CACHE_NAME, key)
    }),
  )
}
