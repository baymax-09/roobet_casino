import { config } from 'src/system'
import { safeToShutdown } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'
import { generateHash } from 'src/modules/game/lib/provably_fair/sharedAlgorithms'
import {
  getPlinkoHashCount,
  getPlinkoHashMaxIndex,
  insertPlinkoHashes,
} from '../documents/plinko_hashes'
import { GameName } from '..'
import { plinkoLogger } from './logger'

/**
 * Worker generates a table of hashes starting from our initial seed.
 * Each hash acts as the Private Key for a particular game.
 *
 * For each game, the worker uses a SHA256 of the previous game's hash to create
 * a new hash (Private Key), then concatenates the NEW hash with the
 * Salt (Public Key) and generates another SHA256 hash from that concatenation,
 * which will serve as the result of that particular game.
 */
export async function buildGameHashTable() {
  const gameName = GameName
  const hashesCount = await getPlinkoHashCount()
  if (hashesCount >= config[gameName].gameCount) {
    return true
  }

  plinkoLogger('buildGameHashTable', { userId: null }).info(
    `generating ${config[gameName].gameCount} hashes for ${gameName}.`,
    { gameName, hashesCount },
  )
  let initialIndex = 0
  let previousHash = ''

  if (hashesCount > 0) {
    const highestHash = await getPlinkoHashMaxIndex()
    initialIndex = (highestHash?.index ?? 0) + 1
    previousHash = highestHash?.hash ?? ''
  }

  let nextHash = config[gameName].seed
  let batch = []
  for (let index = initialIndex; index < config[gameName].gameCount; index++) {
    safeToShutdown()
    if (previousHash) {
      nextHash = generateHash(gameName, previousHash)
    }
    batch.push({
      index,
      previousHash,
      hash: nextHash,
    })
    if (batch.length == 1000) {
      await insertPlinkoHashes(batch)
      await sleep(200)
      batch = []
    }
    previousHash = nextHash
  }

  // commit final batch
  if (batch.length) {
    await insertPlinkoHashes(batch)
  }
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
