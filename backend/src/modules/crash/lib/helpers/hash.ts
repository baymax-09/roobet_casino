import crypto from 'crypto'

import { config } from 'src/system'

export function growthFunction(ms: number) {
  return Math.pow(Math.E, 0.00006 * ms)
}

export function divisible(hash: string, mod: number) {
  /*
   * We will read in 4 hex at a time, but the first chunk might be a bit smaller
   * So ABCDEFGHIJ should be chunked like  AB CDEF GHIJ
   */
  let val = 0

  const o = hash.length % 4
  for (let i = o > 0 ? o - 4 : 0; i < hash.length; i += 4) {
    val = ((val << 16) + parseInt(hash.substring(i, i + 4), 16)) % mod
  }

  return val === 0
}

// Game logic for determining crash point
export function crashPointFromHash(serverSeed: string) {
  const hash = crypto
    .createHmac('sha256', serverSeed)
    .update(config.crash.salt)
    .digest('hex')

  const edge = 100 / config.crash.edge
  if (divisible(hash, edge)) {
    return 1
  }
  // grab random number from hash
  const randomInt = parseInt(hash.slice(0, 52 / 4), 16)
  const exponent = Math.pow(2, 52)
  return (
    Math.floor((100 * exponent - randomInt) / (exponent - randomInt)) / 100.0
  )
}
