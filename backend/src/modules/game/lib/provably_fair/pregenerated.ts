import { type RTable } from 'rethinkdbdash'

import { config, r } from 'src/system'
import { deleteAllActiveBetsForGameId } from 'src/modules/bet'
import { safeToShutdown } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'
import { type RouletteGame } from 'src/modules/roulette/documents/roulette_games'
import { type CrashGame } from 'src/modules/crash/documents/crash_game'
import { type HotboxGame } from 'src/modules/hotbox/documents/hotbox_game'
import { type RouletteHash } from 'src/modules/roulette/documents/roulette_hashes'
import { type ICrashHash } from 'src/modules/crash/documents/crash_hash'
import { type IHotboxHash } from 'src/modules/hotbox/documents/hotbox_hash'

import { saltHash, generateHash } from './sharedAlgorithms'
import { gameLogger } from '../logger'

/*
 * The Salt essentially acts as a Public Key, which is a predetermined hash that
 * we publish to all players.
 *
 * Example game config
 * "<game name>": {
 *   "edge": <number>,
 *   "minBet": <number>,
 *   "maxBet": <number>,
 *   "gameCount": <number>,
 *   "salt": <string>,
 *   "seed": <string>
 * },
 */

interface HashTables {
  roulette: RTable<RouletteHash>
  crash: RTable<ICrashHash>
  hotbox: RTable<IHotboxHash>
}
interface GameTables {
  roulette: RTable<RouletteGame>
  crash: RTable<CrashGame>
  hotbox: RTable<HotboxGame>
}

export async function startNewPregeneratedGame<
  T extends RouletteGame | CrashGame | HotboxGame,
>(
  gameName: T['gameName'],
  gameHashTable: HashTables[T['gameName']],
  gameTable: GameTables[T['gameName']],
  gameIndex: number,
  previousGame: T | null,
  // TODO Technically we only pass a partial and only "hash" field is ever used
  // TODO Promise<object> is there because we check a feature flag in the roulette one
  // We should offload that and inject it
  getExtraFieldsFromGame: (game: T) => object | Promise<object>,
): Promise<T> {
  if (previousGame) {
    await deleteAllActiveBetsForGameId(previousGame.id)
  }
  const hashIndex = config[gameName].gameCount - gameIndex - 1
  if (hashIndex < 0) {
    gameLogger('startNewPregeneratedGame', { userId: null }).error(
      `not enough hashes to continue playing ${gameName}`,
      { gameName },
    )
  }
  const [hash] = await gameHashTable.getAll(hashIndex, { index: 'index' }).run()
  if (!hash) {
    // This condition will be true if the database hasn't been seeded
    throw new Error('no game hashes found')
  }
  const finalHash = saltHash(gameName, hash.hash)
  const randomNumber = Math.floor(Math.random() * 10)

  const newGame = {
    index: gameIndex,
    hashIndex: hash.index,
    maxBet: config[gameName].maxBet,
    gameName,
    previousHash: previousGame ? previousGame.hash : null,
    hash: hash.hash,
    finalHash,
    randomNumber,
    state: 'NotStarted', // TODO - make this an enum
    createdAt: r.now(),
  }
  // @ts-expect-error See TODO above
  const extraFields = await getExtraFieldsFromGame(newGame)

  const { inserted, changes } = await gameTable
    // @ts-expect-error TODO insert isn't liking that gameTable is a union of three RTables
    .insert({ ...newGame, ...extraFields }, { returnChanges: true })
    .run()

  if (inserted <= 0) {
    throw new Error('inserted === 0')
  }
  return changes[0].new_val
}

type Batch = Array<{
  id: string
  index: number
  previousHash: string | null
  hash: string
}>

/**
 * Worker generates a table of hashes starting from our initial seed.
 * Each hash acts as the Private Key for a particular game.
 *
 * For each game, the worker uses a SHA256 of the previous game's hash to create
 * a new hash (Private Key), then concatenates the NEW hash with the
 * Salt (Public Key) and generates another SHA256 hash from that concatenation,
 * which will serve as the result of that particular game.
 */
export async function buildGameHashTable<
  T extends 'roulette' | 'hotbox' | 'crash',
>(gameName: T, gameHashTable: HashTables[T]) {
  const hashesCount = await gameHashTable.count().run()
  if (hashesCount >= config[gameName].gameCount) {
    return true
  }

  gameLogger('buildGameHashTable', { userId: null }).info(
    `generating ${config[gameName].gameCount} hashes for ${gameName}.`,
    { gameName, hashesCount, gameCount: config[gameName].gameCount },
  )
  let initialIndex = 0
  let previousHash = null

  if (hashesCount > 0) {
    const highestHash = await gameHashTable.max('index').run()
    initialIndex = highestHash.index + 1
    previousHash = highestHash.hash
  }

  let nextHash = config[gameName].seed
  let batch: Batch = []
  for (let index = initialIndex; index < config[gameName].gameCount; index++) {
    safeToShutdown()
    if (previousHash) {
      nextHash = generateHash(gameName, previousHash)
    }
    batch.push({
      id: nextHash,
      index,
      previousHash,
      hash: nextHash,
    })
    if (batch.length === 1000) {
      await insertHashBatch(gameHashTable, batch)
      await sleep(200)
      batch = []
    }
    previousHash = nextHash
  }

  // commit final batch
  if (batch.length) {
    await insertHashBatch(gameHashTable, batch)
  }
}

export async function insertHashBatch<
  T extends 'roulette' | 'hotbox' | 'crash',
>(gameHashTable: HashTables[T], batch: Batch) {
  const logger = gameLogger('insertHashBatch', { userId: null })
  let result
  do {
    logger.info(
      `committing batch from ${batch[0].index} to ${
        batch[batch.length - 1].index
      }`,
      {
        firstbatchIndex: batch[0].index,
        lastBatchIndex: batch[batch.length - 1].index,
      },
    )
    try {
      // @ts-expect-error excessive stack depth
      result = await gameHashTable.insert(batch).run()
    } catch {
      logger.error('error inserting hashes, trying again', {
        firstbatchIndex: batch[0].index,
        lastBatchIndex: batch[batch.length - 1].index,
      })
      await sleep(2000)
    }
  } while (!result || result.inserted === 0)
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
