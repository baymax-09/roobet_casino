import { type AsyncOrSync } from 'ts-essentials'
import { redisCache } from 'src/system'
import { TransactionInstrumentor } from 'src/util/instrumentation'
import { scopedLogger } from 'src/system/logger'

/*
 * Storing json objects in redis - the typical use case.
 */

function getKey(name: string, key: string) {
  return name + ':' + key
}

const instrument = TransactionInstrumentor('redis_basicCache_get', 100)

const logger = scopedLogger('redis/basicCache')

export async function get(name: string, key: string) {
  const instrumentEnd = instrument.start()
  const result = await redisCache.getAsync(getKey(name, key))
  instrumentEnd()
  if (!result) {
    return null
  }
  try {
    const parsedResult = JSON.parse(result)
    return parsedResult
  } catch (err) {
    logger('get', { userId: null }).error(
      `Redis GET error by ${name} and ${key} with result ${result}`,
      { name, key, result },
      err,
    )
    return null
  }
}

export async function set(name: string, key: string, value: any, exp: number) {
  await redisCache.setAsync(getKey(name, key), JSON.stringify(value), 'EX', exp)
}

/**
 * Cache with multiple expirations
 */
export async function multilevelCache<T>(
  name: string,
  shortTermExp: number,
  longTermExp: number,
  query: () => AsyncOrSync<T>,
): Promise<T> {
  // get short term cached result if it exists
  const result = await get(name, 'short')
  if (result) {
    return result
  }

  // Attempt to query - store in both short & long term results
  try {
    const queryResult = await query()
    await set(name, 'short', queryResult, shortTermExp)
    await set(name, 'long', queryResult, longTermExp)
    return queryResult
  } catch (error) {
    logger('multilevelCache', { userId: null }).error(
      'error with cached query',
      { name },
      error,
    )
  }
  // Since the query errored check the long term cache
  const longtermResult = await get(name, 'long')
  if (longtermResult) {
    return longtermResult
  }

  // If long term cache does not work retry the query and store in short & long term
  const queryResult = await query()
  await set(name, 'short', queryResult, shortTermExp)
  await set(name, 'long', queryResult, longTermExp)
  return queryResult
}

/**
 * Basic cache value helper.
 *
 * @param name module/domain name
 * @param key cache record key
 * @param exp expiration in seconds
 * @param query value resolver
 * @returns cached result
 */
export async function cached<T>(
  name: string,
  key: string,
  exp: number,
  query: () => T,
): Promise<T> {
  const result = await get(name, key)
  if (result) {
    return result
  }
  const queryResult = await query()
  await set(name, key, queryResult, exp)
  return queryResult
}

export async function invalidate(name: string, key: string) {
  await redisCache.delAsync(getKey(name, key))
}
