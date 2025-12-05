import { redis } from 'src/system'
import { TransactionInstrumentor } from 'src/util/instrumentation'

const instrument = TransactionInstrumentor('redis_mutex', 100)

function getKey(name: string, key: string) {
  return 'genericmutex:' + name + ':' + key
}

export async function checkMutex(name: string, key: string): Promise<boolean> {
  const instumentEnd = instrument.start()
  const result = await redis.getAsync(getKey(name, key))
  instumentEnd()
  return !!result
}

export async function setMutex(name: string, key: string, expiry = 10) {
  const instumentEnd = instrument.start()
  const res = await redis.setAsync(getKey(name, key), true, 'EX', expiry)
  instumentEnd()
  return res
}

export async function deleteMutex(name: string, key: string) {
  const instumentEnd = instrument.start()
  const res = await redis.delAsync(getKey(name, key))
  instumentEnd()
  return res
}
