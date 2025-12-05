import moment from 'moment'
import { type ChangeEvent } from 'rethinkdbdash'

import { winston, config, r } from 'src/system'
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

import { hotboxPointFromHash } from '../lib/helpers/hash'
import {
  type HotboxState,
  StateOver,
  StateNotStarted,
  StateRunning,
  StateTakingBets,
} from '../lib/helpers/states'
import { recordHotboxHistory } from './hotbox_history'
import { HotboxHashModel } from './hotbox_hash'
import { betStateTime } from '../constants/game'
import { hotboxLogger } from '../lib/logger'

type HotboxCountDown =
  | {
      bettingEndTime: number
      runningStartTime: number
    }
  | Record<string, any>

export interface HotboxGame {
  activeBets: Record<string, BetTypes.ActiveBet>
  betFeed?: any | null
  bettingEndTime: Date
  countdown?: HotboxCountDown
  crashPoint: number
  createdAt: Date
  finalHash: string
  gameName: 'hotbox'
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
  state: HotboxState
}

export interface HotboxAutoBet {
  betAmount: number
  maxNumberOfBets: 0
  onLossModifier: number | null
  onWinModifier: number | null
  rolls: number
  stopOnLoss: number
  stopOnProfit: number
}

type TrimmedHotboxGame = Omit<
  HotboxGame,
  'finalHash' | 'crashPoint' | 'hash'
> & {
  finalHash: null
  crashPoint: null
  hash: null
  countdown: HotboxCountDown
}

const HotboxGameModel = r.table<HotboxGame>('hotbox_games')

export async function startNextGame(
  game: HotboxGame,
  previousGame: HotboxGame | undefined | null,
) {
  const nextGameIndex = game.index + 1
  previousGame = game
  return await startNewGame(nextGameIndex, previousGame)
}

export async function getPreviousGame() {
  const [previousGame] = await HotboxGameModel.orderBy({
    index: r.desc('index'),
  })
    .limit(1)
    .run()

  return previousGame || null
}

export async function closeoutGame(game: HotboxGame) {
  const activeBets = await getActiveBetsForGameNotClosedOut(game.id)
  const asyncCloseoutProcess = async function () {
    await Promise.all(
      activeBets.map(async bet => {
        try {
          bet.payoutValue = 0
          bet.crashPoint = game.crashPoint
          await prepareAndCloseoutActiveBet(bet)
        } catch (error) {
          hotboxLogger('closeoutGame', { userId: null }).error(
            'bet close out error',
            { game, bet },
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
    await recordHotboxHistory(game)
    safeToShutdown()
  }

  asyncCloseoutProcess()
}

export async function startNewGame(
  gameIndex: number,
  previousGame: HotboxGame,
) {
  const getExtraFieldsFromGame = function (game: HotboxGame) {
    const bettingEndTime = moment().add(betStateTime, 'ms').toDate()
    const crashPoint = hotboxPointFromHash(game.hash)

    return {
      bettingEndTime,
      crashPoint,
      runningMs: 0,
    }
  }
  return await startNewPregeneratedGame<HotboxGame>(
    'hotbox',
    HotboxHashModel,
    HotboxGameModel,
    gameIndex,
    previousGame,
    getExtraFieldsFromGame,
  )
}

export async function updateGameReturnUpdated(
  id: string,
  update: Partial<HotboxGame>,
) {
  const { replaced, changes } = await HotboxGameModel.get(id)
    .update(update, { returnChanges: true })
    .run()

  if (replaced <= 0) {
    hotboxLogger('updateGameReturnUpdated', { userId: null }).error(
      `Game model update failed`,
      { id, update },
    )
    throw Error('replaced === 0')
  }

  return changes[0].new_val
}

export function trimForFrontend(
  game: HotboxGame,
): TrimmedHotboxGame | HotboxGame {
  // for all time related events, create a `countdown` til that event
  const countdown: Record<string, any> = {}

  for (const key of Object.keys(game)) {
    if (key.includes('Time')) {
      const timeUntilEvent = moment(game[key as keyof HotboxGame]).diff(
        moment(),
      )
      countdown[key] = timeUntilEvent
    }
  }

  if (game.state === StateOver) {
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

export async function getCurrentHotboxGame(): Promise<HotboxGame[]> {
  return await HotboxGameModel.orderBy({ index: r.desc('index') })
    .limit(1)
    .run()
}

export async function getHotboxGameById(
  id: string,
): Promise<HotboxGame | null> {
  return await HotboxGameModel.get(id).run()
}

export async function getActiveHotboxGame(): Promise<{
  game: HotboxGame | TrimmedHotboxGame
  bets: BetTypes.ActiveBet[]
}> {
  const [game] = await getCurrentHotboxGame()
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

export async function getRecentHotboxGames(pageNumber: number) {
  const pageLength = 20

  return await HotboxGameModel.orderBy({ index: r.desc('index') })
    .filter({ state: StateOver })
    .skip(pageLength * pageNumber)
    .limit(pageLength)
    .run()
}

export async function getRecentHotboxNumbers() {
  const winningNumbers = await HotboxGameModel.orderBy({
    index: r.desc('index'),
  })
    .filter({ state: 'Over' })
    .pluck('crashPoint', 'id')
    .limit(100)
    .run()

  return winningNumbers
}

export async function getHotboxBetsByGameId(gameId: string) {
  return await getBetsByGameId(gameId, 'hotbox')
}

export async function joinHotboxGame(
  user: UserTypes.User,
  betAmount: number,
  autoCashout: number,
  balanceTypeOverride: BalanceType | null,
  autobet: HotboxAutoBet | null,
  freeBetItemId: string,
) {
  /*
   * const [ game ] = await getCurrentCrashGame()
   * if (!game || game.state != states.TakingBets) {
   *   throw new APIValidationError('game__not_taking_bets')
   * }
   */
  const gameId = await BasicCache.get('hotbox', 'id')

  const extraBetFields = {
    id: createUniqueID([gameId, user.id]),
    autoCashout,
    autobet,
  }

  await placeBet({
    user,
    game: { id: gameId, gameName: 'hotbox' },
    betAmount,
    extraBetFields,
    balanceTypeOverride,
    freeBetItemId,
  })
}

export async function cashoutHotboxUser(userId: string, betId: string) {
  if (userId && betId) {
    await updateActiveBetForUser(userId, betId, {
      manuallyClosedOut: true,
      manuallyClosedAt: Date.now(),
    })
  }
}

export async function initializeAndRecoverGameState() {
  const logger = hotboxLogger('initializeAndRecoverGameState', { userId: null })
  // Start where we left off
  let previousGame: HotboxGame | null = await getPreviousGame()
  let currentGame

  const easyRecoveryStates = [StateOver, StateNotStarted]
  const refundStates = [StateTakingBets, StateRunning]

  if (!previousGame) {
    logger.info('No previous game was found, starting from beginning')

    if (!config.hotbox.seed) {
      logger.error('Cannot create initial game (seed missing)')
      return
    }

    currentGame = await startNewGame(0, previousGame)
  } else if (easyRecoveryStates.includes(previousGame?.state)) {
    logger.info(`Previous game ended without finishing`, {
      id: previousGame.id,
      index: previousGame.index,
      state: previousGame.state,
    })

    logger.info(`Resuming previous unfinished game`, {
      id: previousGame.id,
      index: previousGame.index,
      state: previousGame.state,
    })
    currentGame = previousGame
    previousGame = null
  } else if (refundStates.includes(previousGame.state)) {
    logger.info(`Previous game ended in a non-recoverable state, Refunding.`, {
      id: previousGame.id,
      index: previousGame.index,
      state: previousGame.state,
    })
    currentGame = previousGame
    currentGame.state = StateOver
    ;(await getActiveBetsForGameNotClosedOut(currentGame.id)).map(async bet => {
      await refundBet(bet, 'hotbox')
    }) // eslint-disable-line indent
    previousGame = null
  }

  return { currentGame, previousGame }
}

export async function hotboxGameFeed() {
  const newFeed = () => {
    return r.table<HotboxGame>('hotbox_games').changes().run()
  }

  const handleChange = (change: ChangeEvent<HotboxGame>) => {
    if (change && change.new_val) {
      const payload = trimForFrontend(change.new_val)
      if (payload) {
        emitSocketEventForGame('hotbox', 'hotboxGameUpdate', payload)
      }
    }
  }

  const opts = {
    ...config.rethinkdb.changefeedReconnectOptions,
    changefeedName: 'hotbox_games',
    logger: winston,
  }

  await recursiveChangefeedHandler(newFeed, handleChange, opts)
}

async function cleanupOldHotboxGames() {
  await cleanupOldTable(
    'hotbox_games',
    r.now().sub(60 * 60 * 24 * 3),
    'createdAt',
  )
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'hotbox_games',
  indices: [
    { name: 'index' },
    { name: 'createdAt' },
    { name: 'state' },
    { name: 'hash' },
  ],
  cleanup: [cleanupOldHotboxGames],
}
