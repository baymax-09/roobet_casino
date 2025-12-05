import moment from 'moment'
import { type ValueOf } from 'ts-essentials'
import { type R_InsertResult } from 'rethinkdbdash'

import { cleanupOldTable } from 'src/util/rethink'
import { config, r } from 'src/system'
import { determineSingleFeatureAccess } from 'src/util/features'
import { sleep } from 'src/util/helpers/timer'
import { createUniqueID } from 'src/util/helpers/id'
import { APIValidationError } from 'src/util/errors'
import { getUserById, type Types as UserTypes } from 'src/modules/user'
import {
  placeBet,
  prepareAndCloseoutActiveBet,
  getActiveBetsForGame,
  getBetsByGameId,
  getActiveBetById,
} from 'src/modules/bet'
import {
  emitSocketEventForGame,
  emitSocketEventForGameForUser,
  gameFeed,
  startNewPregeneratedGame,
} from 'src/modules/game'
import { type DBCollectionSchema } from 'src/modules'
import { type ActiveBet } from 'src/modules/bet/types/Bet'
import { creditBalance } from 'src/modules/user/balance'
import {
  type BetHistoryDocument,
  getBetsByGameIdWon,
} from 'src/modules/bet/documents/bet_history_mongo'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'

import {
  betStateTime,
  payoutStateTime,
  overStateTime,
  getPayoutValue,
  getBetInfo,
  type WinningNumber,
  type OutcomeValue,
} from 'src/modules/roulette/constant/roulette'
import { RouletteStates } from 'src/modules/roulette/constant/states'
import { gameResultFromHash } from 'src/modules/roulette/lib/hash'
import { type RouletteHash } from './roulette_hashes'
import { RouletteHashModel } from './roulette_hashes'
import { RouletteGoldGames, RouletteJackpot } from '.'
import { rouletteLogger } from '../lib/logger'

// for legacy compatibility
export type { RouletteHash } from './roulette_hashes'
export { RouletteHashModel } from './roulette_hashes'

export interface RouletteWinningNumbers {
  winningNumber: number
  spinNumber: number
  id: string
}

export interface RouletteGame {
  id: string
  bettingEndTime: Date
  bettingStartTime: Date
  createdAt: Date
  finalHash: string
  gameName: 'roulette'
  hash: string
  hashIndex: string
  index: number
  maxBet: number
  payoutEndTime: Date
  payoutStartTime: Date
  previousHash: string | null
  randomNumber: string
  resetEndTime: Date
  resetStartTime: Date
  roundEndTime: Date
  roundStartTime: Date
  spinNumber: OutcomeValue
  state: ValueOf<typeof RouletteStates>
  winningNumber: WinningNumber
}

export type TrimmedRouletteGame = Omit<
  RouletteGame,
  'finalHash' | 'hash' | 'winningNumber' | 'randomNumber' | 'spinNumber'
> & {
  finalHash: null
  hash: null
  winningNumber: null
  randomNumber: null
  spinNumber: null
  countdown: object
}

const RouletteGameModel = r.table<RouletteGame>('roulette_games')

export const ROULETTE_JACKPOT_ID = 'roulette_jackpot'
export const ROULETTE_GOLD_GAMES_ID = 'roulette_gold_games'

export async function startNextGame(
  game: RouletteGame,
  previousGame: RouletteGame,
): Promise<RouletteGame> {
  const nextGameIndex = game.index + 1
  previousGame = game
  return await startNewGame(nextGameIndex, previousGame)
}

export async function getPreviousGame(): Promise<RouletteGame | null> {
  const [previousGame] = await RouletteGameModel.orderBy({
    index: r.desc('index'),
  })
    .limit(1)
    .run()

  return previousGame || null
}

const jackpotIncreaseFromBetMultiplier = 0.0066666

export async function payoutGame(game: RouletteGame) {
  const logger = rouletteLogger('payoutGame', { userId: null })
  const activeBets = await getActiveBetsForGame(game.id)

  await Promise.all(
    activeBets.map(async bet => {
      try {
        await prepareAndCloseoutActiveBet({
          ...bet,
          winningNumber: game.winningNumber,
          hash: game.hash,
          payoutValue: await getPayoutValue(bet, game),
        })
      } catch (error) {
        logger.error('error closing out bet', { betId: bet.id }, error)
      }
    }),
  )
}

export async function processRouletteJackpot(
  game: RouletteGame,
  activeBets: ActiveBet[],
) {
  const jackpotAmount = await addToRouletteJackpot(activeBets)

  await resetOrApplyRouletteJackpot(game, activeBets, jackpotAmount)
}

async function addToRouletteJackpot(activeBets: ActiveBet[]): Promise<number> {
  const logger = rouletteLogger('addToRouletteJackpot', { userId: null })
  if (activeBets.length === 0) {
    // Nothing to do
    return 0
  }

  // Add the jackpot increase to the jackpot by multiplying each player's betAmount by the
  // jackpotIncreaseFromBetMultiplier and add it to the basic cache
  const jackpotIncrease = activeBets.reduce(
    (acc, bet) => acc + bet.betAmount * jackpotIncreaseFromBetMultiplier,
    0,
  )
  let previousJackpotValue = 0
  const previousJackpot =
    await RouletteJackpot.getRouletteJackpotById(ROULETTE_JACKPOT_ID)
  let newJackpotValue = 0
  if (previousJackpot) {
    previousJackpotValue = previousJackpot.jackpotAmount
    newJackpotValue = previousJackpotValue + jackpotIncrease
    try {
      await RouletteJackpot.updateRouletteJackpotById(previousJackpot?._id, {
        jackpotId: ROULETTE_JACKPOT_ID,
        jackpotAmount: newJackpotValue,
      })
    } catch (error) {
      logger.error('error updating jackpot', {}, error)
    }
  } else {
    try {
      await RouletteJackpot.insertRouletteJackpot({
        jackpotId: ROULETTE_JACKPOT_ID,
        jackpotAmount: jackpotIncrease,
      })
    } catch (error) {
      logger.error('error creating jackpot', {}, error)
    }
  }

  return newJackpotValue
}

export async function resetOrApplyRouletteJackpot(
  game: RouletteGame,
  activeBets: ActiveBet[],
  passedJackpotAmount: number,
): Promise<boolean> {
  const logger = rouletteLogger('resetOrApplyRouletteJackpot', { userId: null })
  let lastGoldGameIds: string[] = []

  let jackpotId = ''
  let goldGamesId = ''
  try {
    const lastGoldGameIdsDoc = await RouletteGoldGames.getGoldGameById(
      ROULETTE_GOLD_GAMES_ID,
    )

    if (lastGoldGameIdsDoc) {
      goldGamesId = lastGoldGameIdsDoc._id
      if (lastGoldGameIdsDoc.gameIds) {
        lastGoldGameIds = JSON.parse(lastGoldGameIdsDoc.gameIds)
      }
    }
  } catch (error) {
    logger.error('error getting gold games', {}, error)
  }

  if (game.winningNumber == 3) {
    const gameId = game.id
    if (gameId) {
      lastGoldGameIds.push(gameId)
    } else {
      logger.error('gameId not found for game', {
        game,
      })
    }
  } else {
    lastGoldGameIds = []
  }

  if (lastGoldGameIds.length === 3) {
    const jackpotAmount = passedJackpotAmount
    try {
      const jackpot =
        await RouletteJackpot.getRouletteJackpotById(ROULETTE_JACKPOT_ID)
      if (jackpot) {
        // jackpotAmount = jackpot.jackpotAmount
        jackpotId = jackpot._id
      }
    } catch (error) {
      logger.error('error getting jackpot', {}, error)
    }

    if (jackpotId) {
      await RouletteJackpot.updateRouletteJackpotById(jackpotId, {
        jackpotId: ROULETTE_JACKPOT_ID,
        jackpotAmount: 0,
      })
    } else {
      await RouletteJackpot.insertRouletteJackpot({
        jackpotId: ROULETTE_JACKPOT_ID,
        jackpotAmount: 0,
      })
    }
    if (goldGamesId) {
      await RouletteGoldGames.updateRouletteGoldGameById(goldGamesId, {
        someId: ROULETTE_GOLD_GAMES_ID,
        gameIds: JSON.stringify([]),
      })
    } else {
      await RouletteGoldGames.insertGoldGame({
        someId: ROULETTE_GOLD_GAMES_ID,
        gameIds: JSON.stringify([]),
      })
    }

    if (jackpotAmount) {
      const jackpotPayoutPerGame = jackpotAmount / 3
      const rouletteRework = await determineSingleFeatureAccess({
        countryCode: '',
        featureName: 'housegames:roulette',
      })
      if (rouletteRework) {
        emitSocketEventForGame('roulette', 'rouletteJackpotWon', {
          amount: jackpotAmount,
        })
      }
      await Promise.all(
        lastGoldGameIds.map(async gameId => {
          // We filter by won because we only want to credit users who bet on gold
          let jackpotWinningBets: Array<ActiveBet | BetHistoryDocument> =
            activeBets
          jackpotWinningBets = activeBets.filter(bet => bet.betSelection === 3)
          const isThirdRound = gameId === game.id
          if (!isThirdRound) {
            jackpotWinningBets = await getBetsByGameIdWon(
              gameId,
              'roulette',
              true,
            )
          }

          const betsCount = jackpotWinningBets.length || 1
          const jackpotPayout = jackpotPayoutPerGame / betsCount
          await Promise.all(
            jackpotWinningBets.map(async bet => {
              const user = await getUserById(bet.userId)
              if (!user) {
                throw new APIValidationError('user__does_not_exist', [
                  bet.userId,
                ])
              }
              const rouletteRework = await determineSingleFeatureAccess({
                countryCode: user.countryCode,
                user,
                featureName: 'housegames:roulette',
              })
              if (rouletteRework) {
                emitSocketEventForGameForUser(
                  'roulette',
                  user.id,
                  'userRouletteJackpotWon',
                  { amount: jackpotPayout },
                )
                await creditBalance({
                  user,
                  amount: jackpotPayout,
                  meta: {
                    betId:
                      !isThirdRound && bet.betId
                        ? bet.betId
                        : 'id' in bet
                          ? bet.id
                          : bet._id.toString(),
                    gameId: bet.gameId,
                  },
                  transactionType: 'roulette_jackpot_win',
                  balanceTypeOverride: bet.balanceType,
                })
              }
            }),
          )
        }),
      )
    }

    return true
  } else {
    if (goldGamesId) {
      await RouletteGoldGames.updateRouletteGoldGameById(goldGamesId, {
        someId: ROULETTE_GOLD_GAMES_ID,
        gameIds: JSON.stringify(lastGoldGameIds),
      })
    } else {
      await RouletteGoldGames.insertGoldGame({
        someId: ROULETTE_GOLD_GAMES_ID,
        gameIds: JSON.stringify(lastGoldGameIds),
      })
    }
  }
  return false
}

export async function startNewGame(
  gameIndex: number,
  previousGame: RouletteGame | null = null,
): Promise<RouletteGame> {
  const getExtraFieldsFromGame = async function (game: RouletteGame) {
    const result = await gameResultFromHash(game.finalHash)
    if (result) {
      const { winningNumber, spinNumber } = result
      return { winningNumber, spinNumber }
    }
  }

  return await startNewPregeneratedGame<RouletteGame>(
    'roulette',
    RouletteHashModel,
    RouletteGameModel,
    gameIndex,
    previousGame,
    getExtraFieldsFromGame,
  )
}

export async function updateGameReturnUpdated(
  id: string,
  update: Partial<RouletteGame>,
): Promise<RouletteGame> {
  const { replaced, changes } = await RouletteGameModel.get(id)
    .update(update, { returnChanges: true })
    .run()

  if (replaced <= 0) {
    throw new APIValidationError('replaced__zero')
  }

  return changes[0].new_val
}

export async function insertHashBatch(batch: RouletteHash[]) {
  const logger = rouletteLogger('insertHashBatch', { userId: null })
  let result: R_InsertResult | null = null
  do {
    logger.info(
      `committing batch from ${batch[0].index} to ${
        batch[batch.length - 1].index
      }`,
    )
    try {
      result = await RouletteHashModel.insert(batch).run()
    } catch (err) {
      logger.error('error inserting hashes, trying again', {}, err)
      await sleep(2000)
    }
  } while (!result || result.inserted === 0)
}

type TrimResponse = (RouletteGame & { countdown: object }) | TrimmedRouletteGame

export function trimForFrontend(game: RouletteGame): TrimResponse {
  // for all time related events, create a `countdown` til that event
  const countdown = {}
  for (const key of Object.keys(game)) {
    if (key.includes('Time')) {
      // @ts-expect-error dumb key stuff
      const timeUntilEvent = moment(game[key]).diff(moment())
      // @ts-expect-error dumb key stuff
      countdown[key] = timeUntilEvent
    }
  }

  if (
    game.state === RouletteStates.Over ||
    game.state === RouletteStates.Payout
  ) {
    return { ...game, countdown }
  }

  return {
    ...game,
    countdown,
    finalHash: null,
    hash: null,
    winningNumber: null,
    randomNumber: null,
    spinNumber: null,
  }
}

export async function getCurrentRouletteGame(): Promise<RouletteGame[]> {
  return await RouletteGameModel.orderBy({ index: r.desc('index') })
    .limit(1)
    .run()
}

export async function getRouletteGameById(
  id: string,
): Promise<RouletteGame | null> {
  return await RouletteGameModel.get(id).run()
}

export async function getActiveRouletteGame() {
  const [game] = await getCurrentRouletteGame()
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

export async function getRecentRouletteGames(
  pageNumber: number,
): Promise<RouletteGame[]> {
  const pageLength = 20

  return await RouletteGameModel.orderBy({ index: r.desc('index') })
    .filter({ state: RouletteStates.Over })
    .skip(pageLength * pageNumber)
    .limit(pageLength)
    .run()
}

export async function getRecentRouletteNumbers(): Promise<
  RouletteWinningNumbers[]
> {
  const winningNumbers = await RouletteGameModel.orderBy({
    index: r.desc('index'),
  })
    .filter({ state: 'Over' })
    .pluck('spinNumber', 'winningNumber', 'id')
    .limit(100)
    .run()

  return winningNumbers
}

export async function getRouletteBetsByGameId(gameId: string) {
  return await getBetsByGameId(gameId, 'roulette')
}

export async function joinRouletteGame(
  user: UserTypes.User,
  betAmount: number,
  betSelection: WinningNumber,
  freeBetItemId: string,
) {
  const [game] = await getCurrentRouletteGame()
  if (!game || game.state !== RouletteStates.TakingBets) {
    throw new APIValidationError('game__not_taking_bets')
  }

  // check for current wager.
  const betId = createUniqueID([
    game.id,
    user.id,
    betSelection,
    user.selectedBalanceField,
  ])
  const currentBet = await getActiveBetById(betId)

  if (currentBet) {
    const betInfo = await getBetInfo()
    if (
      betInfo[betSelection].multiplier * (currentBet.betAmount + betAmount) >
      config.bet.maxProfit
    ) {
      const convertedMax = await exchangeAndFormatCurrency(
        config.roulette.maxBet,
        user,
      )
      throw new APIValidationError('bet__convertedMaximum_bet', [
        `${convertedMax}`,
      ])
    }
  }

  const extraBetFields = {
    id: createUniqueID([
      game.id,
      user.id,
      betSelection,
      user.selectedBalanceField,
    ]),
    betSelection,
  }

  if (betSelection === 3 && betAmount > config.roulette.maxBet / 2) {
    const convertedMax = await exchangeAndFormatCurrency(
      config.roulette.maxBet / 2,
      user,
    )
    throw new APIValidationError('roulette__convertedGold_max', [
      `${convertedMax}`,
    ])
  }

  await placeBet({ user, game, betAmount, extraBetFields, freeBetItemId })
}

export function generateGameTimestamps() {
  const roundStartTime = moment()
  const bettingStartTime = moment()
  const bettingEndTime = bettingStartTime.clone().add(betStateTime, 'ms')
  const payoutStartTime = bettingEndTime // .add(0, 'ms')
  const payoutEndTime = payoutStartTime.clone().add(payoutStateTime, 'ms')
  const resetStartTime = payoutEndTime
  const resetEndTime = resetStartTime.clone().add(overStateTime, 'ms')
  const roundEndTime = resetEndTime
  return {
    roundStartTime: roundStartTime.toDate(),
    bettingStartTime: bettingStartTime.toDate(),
    bettingEndTime: bettingEndTime.toDate(),
    payoutStartTime: payoutStartTime.toDate(),
    payoutEndTime: payoutEndTime.toDate(),
    resetStartTime: resetStartTime.toDate(),
    resetEndTime: resetEndTime.toDate(),
    roundEndTime: roundEndTime.toDate(),
  }
}

/** Start global roulette game where we left off */
export async function initializeAndRecoverGameState() {
  const logger = rouletteLogger('initializeAndRecoverGameState', {
    userId: null,
  })
  let previousGame = await getPreviousGame()
  let currentGame

  if (!previousGame) {
    logger.info('No previous game was found, starting from beginning')

    if (!config.roulette.seed) {
      logger.error('Cannot create initial game (seed missing)')
      return {}
    }

    currentGame = await startNewGame(0)
  } else if (previousGame.state !== RouletteStates.Over) {
    logger.info('Previous game ended without finishing with the state', {
      state: previousGame.state,
      id: previousGame.id,
      index: previousGame.index,
    })

    logger.info('Resuming previous unfinished game', {
      state: previousGame.state,
    })
    if (previousGame.state === RouletteStates.TakingBets) {
      const update = generateGameTimestamps()
      currentGame = await updateGameReturnUpdated(previousGame.id, update)
    } else if (previousGame.state === RouletteStates.Payout) {
      const update = generateGameTimestamps()
      currentGame = await updateGameReturnUpdated(previousGame.id, update)
    } else {
      currentGame = previousGame
    }

    previousGame = null
  } else {
    currentGame = await startNextGame(previousGame, previousGame)
  }

  return { currentGame, previousGame }
}

export async function getRouletteFeed() {
  await gameFeed<RouletteGame>('roulette', async function (game) {
    return trimForFrontend(game)
  })
}

export async function cleanupRoulette() {
  await cleanupOldTable(
    'roulette_games',
    r.now().sub(60 * 60 * 24 * 3),
    'createdAt',
  )
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'roulette_games',
  indices: [
    { name: 'index' },
    { name: 'state' },
    { name: 'hash' },
    { name: 'createdAt' },
  ],
  feeds: [getRouletteFeed],
  cleanup: [cleanupRoulette],
}
