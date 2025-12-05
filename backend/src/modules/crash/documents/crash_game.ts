import moment from 'moment'
import { type ChangeEvent } from 'rethinkdbdash'

import { config, r } from 'src/system'
import { createUniqueID } from 'src/util/helpers/id'
import { recursiveChangefeedHandler, cleanupOldTable } from 'src/util/rethink'
import { safeToShutdown } from 'src/util/workerRunner'
import { APIValidationError } from 'src/util/errors'
import { type Types as BetTypes } from 'src/modules/bet'
import {
  updateBetHistoryForGame,
  updateActiveBetForUser,
  placeBet,
  refundBet,
  prepareAndCloseoutActiveBet,
  getActiveBetsForGame,
  getActiveBetsForGameNotClosedOut,
  getBetsByGameId,
} from 'src/modules/bet'
import {
  startNewPregeneratedGame,
  emitSocketEventForGame,
} from 'src/modules/game'
import { BasicCache } from 'src/util/redisModels'
import { type DBCollectionSchema } from 'src/modules'
import { type Types as UserTypes } from 'src/modules/user'
import { type BalanceType } from 'src/modules/user/types'
import { type ScopedLogger } from 'src/system/logger'

import { crashPointFromHash } from '../lib/helpers/hash'
import { type CrashState, CrashStates } from '../lib/helpers/states'
import { crashLogger } from '../lib/logger'
import { recordCrashHistory } from './crash_history_mongo'
import { CrashHashModel } from './crash_hash'
import { betStateTime } from '../constants/game'

type CrashCountDown =
  | {
      bettingEndTime: number
      runningStartTime: number
    }
  | Record<string, any>

export interface CrashGame {
  activeBets: Record<string, BetTypes.ActiveBet>
  betFeed?: any | null
  bettingEndTime: Date
  countdown?: CrashCountDown
  crashPoint: number
  createdAt: string
  finalHash: string
  gameName: 'crash'
  hash: string
  hashIndex: number
  id: string
  index: number
  maxBet: string
  previousHash: string | null
  randomNumber: number
  runningMs: number
  rerunState?: boolean
  runningStartTime: Date
  state: CrashState
}

export interface CrashAutoBet {
  betAmount: number
  maxNumberOfBets: 0
  onLossModifier: number | null
  onWinModifier: number | null
  rolls: number
  stopOnLoss: number
  stopOnProfit: number
}

type TrimmedCrashGame = Omit<CrashGame, 'finalHash' | 'crashPoint' | 'hash'> & {
  finalHash: null
  crashPoint: null
  hash: null
  countdown: CrashCountDown
}

const CrashGameModel = r.table<CrashGame>('crash_games')

export async function startNextGame(game: CrashGame, previousGame: CrashGame) {
  const nextGameIndex = game.index + 1
  previousGame = game
  return await startNewGame(nextGameIndex, previousGame)
}

export async function getPreviousGame() {
  const [previousGame] = await CrashGameModel.orderBy({
    index: r.desc('index'),
  })
    .limit(1)
    .run()

  return previousGame || null
}

export async function closeoutGame(game: CrashGame) {
  const activeBets = await getActiveBetsForGameNotClosedOut(game.id)
  const asyncCloseoutProcess = async function () {
    await Promise.all(
      activeBets.map(async bet => {
        try {
          bet.payoutValue = 0
          bet.crashPoint = game.crashPoint
          await prepareAndCloseoutActiveBet(bet)
        } catch (error) {
          crashLogger('closeoutGame', { userId: null }).error(
            'bet close out error',
            {},
            error,
          )
        }
      }),
    )
    await updateBetHistoryForGame(game.id, {
      hash: game.hash,
      // @ts-expect-error investigate the type of game.crashPoint
      crashPoint: parseFloat(game.crashPoint),
    })
    await recordCrashHistory(game)
    safeToShutdown()
  }

  asyncCloseoutProcess()
}

export async function startNewGame(gameIndex: number, previousGame: CrashGame) {
  const getExtraFieldsFromGame = function (game: CrashGame) {
    const bettingEndTime = moment().add(betStateTime, 'ms').toDate()
    const crashPoint = crashPointFromHash(game.hash)

    return {
      bettingEndTime,
      crashPoint,
      runningMs: 0,
    }
  }
  return await startNewPregeneratedGame<CrashGame>(
    'crash',
    CrashHashModel,
    CrashGameModel,
    gameIndex,
    previousGame,
    getExtraFieldsFromGame,
  )
}

export async function updateGameReturnUpdated(
  id: string,
  update: Partial<CrashGame>,
) {
  const { replaced, changes } = await CrashGameModel.get(id)
    .update(update, { returnChanges: true })
    .run()

  if (replaced <= 0) {
    crashLogger('updateGameReturnUpdated', { userId: null }).error(
      'replaced <= 0',
      { id, update },
    )
    throw Error('replaced === 0')
  }

  return changes[0].new_val
}

export function trimForFrontend(game: CrashGame): TrimmedCrashGame | CrashGame {
  // for all time related events, create a `countdown` til that event
  const countdown: Record<string, any> = {}

  for (const key of Object.keys(game)) {
    if (key.includes('Time')) {
      const timeUntilEvent = moment(game[key as keyof CrashGame]).diff(moment())
      countdown[key] = timeUntilEvent
    }
  }

  if (game.state === CrashStates.Over) {
    return {
      ...game,
      countdown,
    }
  }
  // do not display anything that could alert the user what the crash point is.
  return {
    ...game,
    countdown,
    finalHash: null,
    hash: null,
    crashPoint: null,
  }
}

export async function getCurrentCrashGame() {
  return await CrashGameModel.orderBy({ index: r.desc('index') })
    .limit(1)
    .run()
}

export async function getCrashGameById(id: string): Promise<CrashGame | null> {
  return await CrashGameModel.get(id).run()
}

export async function getActiveCrashGame(): Promise<{
  game: CrashGame | TrimmedCrashGame
  bets: BetTypes.ActiveBet[]
}> {
  const [game] = await getCurrentCrashGame()
  const bets = await getActiveBetsForGame(game.id)
  if (game) {
    return {
      game: trimForFrontend(game),
      bets,
    }
  } else {
    throw new APIValidationError('game__maintenance')
  }
}

export async function getRecentCrashGames(pageNumber: number) {
  const pageLength = 20

  return await CrashGameModel.orderBy({ index: r.desc('index') })
    .filter({ state: CrashStates.Over })
    .skip(pageLength * pageNumber)
    .limit(pageLength)
    .run()
}

export async function getRecentCrashNumbers() {
  const winningNumbers = await CrashGameModel.orderBy({
    index: r.desc('index'),
  })
    .filter({ state: 'Over' })
    .pluck('crashPoint', 'id')
    .limit(100)
    .run()

  return winningNumbers
}

export async function getCrashBetsByGameId(gameId: string) {
  return await getBetsByGameId(gameId, 'crash')
}

export async function joinCrashGame(
  user: UserTypes.User,
  betAmount: number,
  autoCashout: number,
  balanceTypeOverride: BalanceType | null,
  autobet: CrashAutoBet | null,
  freeBetItemId: string,
) {
  /*
   * const [ game ] = await getCurrentCrashGame()
   * if (!game || game.state != states.TakingBets) {
   *   throw new APIValidationError('game__not_taking_bets')
   * }
   */
  const gameId = await BasicCache.get('crash', 'id')

  const extraBetFields = {
    id: createUniqueID([gameId, user.id]),
    autoCashout,
    autobet,
  }

  await placeBet({
    user,
    game: { id: gameId, gameName: 'crash' },
    betAmount,
    extraBetFields,
    balanceTypeOverride,
    freeBetItemId,
  })
}

export async function cashoutCrashUser(userId: string, betId: string) {
  if (userId && betId) {
    await updateActiveBetForUser(userId, betId, {
      manuallyClosedOut: true,
      manuallyClosedAt: Date.now(),
    })
  }
}

export async function initializeAndRecoverGameState() {
  const logger: ScopedLogger = crashLogger('initializeAndRecoverGameState', {
    userId: null,
  })
  // Start where we left off
  let previousGame: CrashGame | null = await getPreviousGame()
  let currentGame = null

  const easyRecoveryStates: Array<Partial<CrashState>> = [
    CrashStates.Over,
    CrashStates.NotStarted,
  ]

  const refundStates: Array<Partial<CrashState>> = [
    CrashStates.TakingBets,
    CrashStates.Running,
  ]

  if (!previousGame) {
    logger.info('[crash] No previous game was found, starting from beginning')

    if (!config.crash.seed) {
      logger.error('[crash] Cannot create initial game (seed missing)')
      return
    }

    currentGame = await startNewGame(0, previousGame)
  } else if (easyRecoveryStates.includes(previousGame.state)) {
    logger.info(
      `[crash] Previous game ended without finishing with the state ${previousGame.state}`,
      {
        id: previousGame.id,
        index: previousGame.index,
        state: previousGame.state,
      },
    )

    logger.info(
      `[crash] Resuming previous unfinished game, state = ${previousGame.state}`,
      { state: previousGame.state },
    )
    currentGame = previousGame
    previousGame = null
  } else if (refundStates.includes(previousGame.state)) {
    logger.info(
      `[crash] Previous game ended in a non-recoverable state: ${previousGame.state}. Refunding.`,
      { state: previousGame.state },
    )
    currentGame = previousGame
    currentGame.state = CrashStates.Over
    ;(await getActiveBetsForGameNotClosedOut(currentGame.id)).map(async bet => {
      await refundBet(bet, 'crash')
    }) // eslint-disable-line indent
    previousGame = null
  }

  return { currentGame, previousGame }
}

export async function crashGameFeed() {
  const logger: ScopedLogger = crashLogger('crashGameFeed', { userId: null })

  const newFeed = () => {
    return CrashGameModel.changes().run()
  }

  const handleChange = (change: ChangeEvent<CrashGame>) => {
    if (change && change.new_val) {
      const payload = trimForFrontend(change.new_val)
      if (payload) {
        emitSocketEventForGame('crash', 'crashGameUpdate', payload)
      }
    }
  }

  const opts = {
    ...config.rethinkdb.changefeedReconnectOptions,
    changefeedName: 'crash_games',
    logger,
  }

  await recursiveChangefeedHandler(newFeed, handleChange, opts)
}

async function cleanupOldCrashGames() {
  await cleanupOldTable(
    'crash_games',
    r.now().sub(60 * 60 * 24 * 3),
    'createdAt',
  )
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'crash_games',
  indices: [
    { name: 'index' },
    { name: 'createdAt' },
    { name: 'state' },
    { name: 'hash' },
  ],
  cleanup: [cleanupOldCrashGames],
}
