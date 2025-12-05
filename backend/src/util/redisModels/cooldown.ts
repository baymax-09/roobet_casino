import { redisCache } from 'src/system'

function getKey(key: string) {
  return 'cooldown' + ':' + key
}

export async function check(key: string) {
  return await redisCache.ttlAsync(getKey(key))
}

export async function checkSet(key: string, exp: number) {
  const result = await check(key)
  if (result < 0) {
    await set(key, exp)
  }
  return result
}

export async function set(key: string, exp: number) {
  return await redisCache.setAsync(getKey(key), true, 'EX', exp)
}

export async function processFunctionOnCooldown(
  key: string,
  exp: number,
  fnToCall: () => Promise<unknown>,
) {
  const cooldown = await checkSet(key, exp)
  if (cooldown <= 0) {
    await fnToCall()
  }
}
