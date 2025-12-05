import { generateLightningPayouts } from './payout_generator'
import { config } from 'src/system'
import { saltHash } from 'src/modules/game/lib/provably_fair/sharedAlgorithms'
import { GameName } from '..'
import { getPlinkoHashByIndex } from '../documents/plinko_hashes'
import {
  generateEveryPossiblePath,
  LIGHTNING_BOARD_ROW_NUMBERS,
  type SpecialCell,
} from './lightning_board'
import { getPayoutForEdge, type BoardInfo } from './payout_list'
import { BasicCache } from 'src/util/redisModels'

import { plinkoLogger } from './logger'

export interface LightningBoardResponse {
  gameIndex: number
  payouts: number[]
  multiplierCells: SpecialCell[]
  remainingTimeInMinutes: number
  pregeneratedPlinkoHash?: string
}

export interface LightningBoard {
  payouts: number[]
  multiplierCells: SpecialCell[]
}

const board_interval = 1000 * 60 * 15 // Every 15 minutes
export async function getCurrentLightningPayouts(): Promise<LightningBoardResponse> {
  // Get unix time and get every 3 hours period

  const baseCurrentMilliseconds = Date.now()
  const gameCount = config.plinko.gameCount

  const gameIndexFloat = baseCurrentMilliseconds / board_interval
  const gameIndex = Math.floor(gameIndexFloat)

  const nextGameIndex = gameIndex + 1
  const nextUnixTimeForGameIndex = Number(nextGameIndex) * board_interval
  const remainingTimeInMinutes =
    (nextUnixTimeForGameIndex - baseCurrentMilliseconds) / (1000 * 60) // Convert to minutes
  const currentGameIndex = gameIndex % gameCount

  const cached_board: LightningBoardResponse = await BasicCache.get(
    'plinko',
    'lightning_board',
  )
  if (cached_board && cached_board.gameIndex === gameIndex) {
    return {
      payouts: cached_board.payouts,
      gameIndex: currentGameIndex,
      multiplierCells: cached_board.multiplierCells,
      remainingTimeInMinutes,
    }
  }

  const new_board = await getLightningPayoutsForGameIndex(
    currentGameIndex,
    remainingTimeInMinutes,
  )
  await BasicCache.set('plinko', 'lightning_board', new_board, board_interval)
  return new_board
}

export async function getLightningPayoutsForGameIndex(
  gameIndex: number,
  remainingTimeInMinutes = 0,
): Promise<LightningBoardResponse> {
  // Get unix time and get every 1 hour period

  const hash = await getPregeneratedPlinkoHash(gameIndex)
  let env_edge = process.env.PLINKO_LIGHTNING_HOUSE_EDGE
  if (!env_edge) {
    plinkoLogger('getLightningPayoutsForGameIndex', { userId: null }).error(
      'PLINKO_LIGHTNING_HOUSE_EDGE environment variable not set',
    )
    env_edge = '4'
  }
  const edge = parseFloat(env_edge)

  const { pathCells } = generateEveryPossiblePath(LIGHTNING_BOARD_ROW_NUMBERS)

  const { payouts, multiplierCells } = generateLightningPayouts(
    hash,
    edge,
    pathCells,
    LIGHTNING_BOARD_ROW_NUMBERS,
  )

  return {
    payouts,
    gameIndex,
    multiplierCells,
    remainingTimeInMinutes,
    pregeneratedPlinkoHash: hash,
  }
}

export async function getPregeneratedPlinkoHash(gameIndex: number) {
  const hash = await getPregeneratedHash(GameName, gameIndex)
  const finalHash = saltHash(GameName, hash)

  return finalHash
}

/**
 * Returns pregenerated hash from database
 *
 * @param gameName string
 * @param gameHashTable rethink table
 * @param gameIndex int
 * @returns object containing hash field
 */
export async function getPregeneratedHash(
  gameName: 'plinko',
  gameIndex: number,
): Promise<string> {
  const logger = plinkoLogger('getPregeneratedHash', { userId: null })
  const hashIndex = config[gameName].gameCount - gameIndex - 1
  if (hashIndex < 0) {
    logger.error(`Invalid hashIndex ${hashIndex}`, {
      gameName,
      gameIndex,
      hashIndex,
    })
  }
  const hashDocument = await getPlinkoHashByIndex(`${hashIndex}`)
  if (!hashDocument) {
    // This condition will be true if the database hasn't been seeded
    logger.error(`Plinko board hash with index ${hashIndex} not found`, {
      gameName,
      gameIndex,
      hashIndex,
    })
    return ''
  }
  if (!hashDocument.hash) {
    logger.error(`Plinko board hash with index ${hashIndex} has empty hash`, {
      gameName,
      gameIndex,
      hashIndex,
    })
  }

  return hashDocument.hash
}

export async function getAllBoardInfo(): Promise<BoardInfo> {
  let env_edge = process.env.PLINKO_HOUSE_EDGE
  if (!env_edge) {
    plinkoLogger('getAllBoardInfo', { userId: null }).error(
      'PLINKO_HOUSE_EDGE environment variable not set',
    )
    env_edge = '1'
  }
  const edge: number = parseFloat(env_edge)

  const lightning_board = await getCurrentLightningPayouts()
  const boardInfo: BoardInfo = {
    standard: getPayoutForEdge(edge),
    lightning: lightning_board,
  }
  return boardInfo
}
