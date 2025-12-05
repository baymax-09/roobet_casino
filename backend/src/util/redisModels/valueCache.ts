import { redisCache } from 'src/system'

/*
 * storing a simple value such as a number or string in redis - for performance.
 */

function getKey(name: string, key: string) {
  return name + ':' + key
}

export async function get(name: string, key: string) {
  const result = await redisCache.getAsync(getKey(name, key))
  if (!result) {
    return null
  }
  return result
}

/**
 * @param exp time in seconds
 */
export async function set(name: string, key: string, value: any, exp: number) {
  await redisCache.setAsync(getKey(name, key), value, 'EX', exp)
}

export async function incrBy(name: string, key: string, value: number) {
  await redisCache.incrbyAsync(getKey(name, key), value)
}

export async function decrBy(name: string, key: string, value: number) {
  await redisCache.decrbyAsync(getKey(name, key), value)
}

// there is no decrbyfloat in redis, so pass a negative float to decrement
export async function incrByFloat(name: string, key: string, value: number) {
  await redisCache.incrbyfloatAsync(getKey(name, key), value)
}

export async function expire(name: string, key: string, exp: number) {
  await redisCache.expire(getKey(name, key), exp)
}

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
