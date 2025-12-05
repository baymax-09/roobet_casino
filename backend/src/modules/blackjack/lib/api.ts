import { placeBet, refundBet } from 'src/modules/bet'
import {
  generateHmac,
  saltWithClientSeed,
} from 'src/modules/game/lib/provably_fair/sharedAlgorithms'
import { startNewRound } from 'src/modules/game/lib/round'
import { type User } from 'src/modules/user/types/User'
import { scopedLogger, type LoggerContext } from 'src/system/logger'
import { isFulfilled, isRejected } from 'src/util/promise'
import {
  BLACKJACK_GAME_NAME,
  BlackjackAggregateError,
  BlackjackError,
  BlackjackGameNotFoundError,
  BlackjackMissingRoundIdError,
  BlackjackNonGamePlayerError,
  ClientGameState,
  GameStatus,
  WagerOutcomeType,
  isUserHandMainWagerWithSides,
  type CreateGameOptions,
  type GameRoundHashes,
  type PlayerHashParts,
  type PlayerSeatRequest,
  type UserHandMainWagerRequest,
  type UserSeatRequest,
} from '../types'
import { buildBetHandWagers, type BlackjackExtraBetParams } from '../types/bets'
import { getRandomSeed, validateWagers } from '../utils'
import { doubleDown, hit, insure, split, stand } from './actions'
import {
  createGame,
  gameExists,
  getGame,
  getPlayerGames,
  startGame,
} from './game'

const logScope = 'api'
const baseContext = { userId: null }
const logger = (scope: string = logScope, context?: LoggerContext) =>
  scopedLogger(BLACKJACK_GAME_NAME)(scope, context ?? baseContext)

/**
 * Creates a new game of blackjack.
 * @param user The user creating the game.
 * @returns A pending {@link ClientGameState} with an `id` and preliminary `hash`.
 */
export async function createUserGame(user: User): Promise<ClientGameState> {
  const hash = getRandomSeed()
  const game = await createGame(hash, user.id)
  return ClientGameState.fromGameState(game)
}

/**
 * Gets a game of blackjack.
 * @param id The game `id`.
 * @param user The requesting user.
 * @returns The {@link ClientGameState} for the game.
 */
export async function getUserGame(
  id: string,
  user: User,
): Promise<ClientGameState> {
  const game = await getGame(id)
  const isUserGame = game.players.some(player => player.playerId === user.id)
  if (!isUserGame) {
    throw BlackjackError.logAndReturn(
      new BlackjackNonGamePlayerError(id, logScope, user.id),
    )
  }

  return ClientGameState.fromGameState(game)
}

/**
 * Gets all games of blackjack for a {@link User}.
 * @param user The requesting {@link User}.
 * @returns An array of {@link ClientGameState}s for the user, or an empty array if none exist.
 */
export async function getUserGames(user: User): Promise<ClientGameState[]> {
  return (await getPlayerGames(user.id)).map(game =>
    ClientGameState.fromGameState(game),
  )
}

/**
 * Starts a created game of blackjack.
 * @param id The game `id``.
 * @param requests The {@link UserSeatRequest}s, one per player at the {@link Table}.
 * @returns The {@link ClientGameState} for the game.
 * @description This function is meant to run as a queue job.
 */
export async function startUserGame(
  id: string,
  requests: UserSeatRequest[],
  options?: CreateGameOptions,
): Promise<ClientGameState> {
  const exists = await gameExists(id, GameStatus.Pending)
  if (!exists) {
    throw BlackjackError.logAndReturn(
      new BlackjackGameNotFoundError(id, logScope),
    )
  }

  const opts = options ?? {}

  // Validate wagers amounts, and homogenous types across all users
  const [wagerGroup, validRequests] = validateWagers(id, requests)

  // Get the created game
  const game = await getGame(id)

  // Get the game seed, generated at creation, this will become the hash via `createFinalHash` and `startGame`.
  const { seed } = game

  // Start a new round for each user
  const rounds = await Promise.all(
    validRequests.map(async req => {
      // Hash should NEVER be returned.
      const { provablyFairInfo } = await startNewRound(
        req.user,
        BLACKJACK_GAME_NAME,
        req.clientSeed,
      )
      const extraBetParams: BlackjackExtraBetParams = {
        clientSeed: provablyFairInfo.clientSeed,
        roundId: provablyFairInfo.currentRound._id.toString(),
        roundHash: provablyFairInfo.currentRound.hash,
        nonce: provablyFairInfo.currentRound.nonce,
      }
      return { [req.user.id]: { provablyFairInfo, extraBetParams } }
    }),
  ).then(records => records.reduce((pre, cur) => ({ ...pre, ...cur })))

  // Validate that all rounds have an ID
  if (
    Object.keys(rounds).some(
      key => rounds[key].provablyFairInfo.currentRound.id === undefined,
    )
  ) {
    throw BlackjackError.logAndReturn(
      new BlackjackMissingRoundIdError(id, logScope),
    )
  }

  // Place the bets for all users
  const seats: PlayerSeatRequest[] = requests.map(req => ({
    playerId: req.user.id,
    betId: '',
    clientSeed: req.clientSeed,
    seatIndex: req.seatIndex,
    wagers: req.wagers.map(wager => ({
      type: wager.type,
      amount: wager.amount,
      handIndex: wager.handIndex,
      sides: wager.sides?.map(side => ({
        type: side.type,
        amount: side.amount,
        outcome: WagerOutcomeType.Unknown,
      })),
    })),
  }))
  if (wagerGroup === 'live') {
    const userBets = validRequests.map((req, ndx) => {
      return {
        user: req.user,
        game: { id: game.id, gameName: BLACKJACK_GAME_NAME },
        betAmount: getFullBetAmount(req.wagers),
        extraBetFields: {
          ...rounds[req.user.id].extraBetParams,
          seatIndex: ndx,
          playerCount: requests.length,
          handWagers: buildBetHandWagers(req.wagers),
        },
        balanceTypeOverride: null,
      }
    })

    // Place all the bets and capture success and failures
    const results = await Promise.allSettled(
      userBets.map(async bet => await placeBet(bet)),
    )
    const actives = results.filter(isFulfilled).map(res => res.value)
    const errors = results.filter(isRejected).map(res => res.reason)

    // If any failed then the table isn't whole, refund all bets and throw
    if (errors.length > 0) {
      if (actives.length > 0) {
        // Refund all successful bets
        await Promise.all(
          actives.map(async active => {
            await refundBet(active, BLACKJACK_GAME_NAME)
          }),
        )
      }
      // Throw the errors back
      throw BlackjackError.logAndReturn(
        new BlackjackAggregateError(game.id, logScope, errors),
      )
    }

    // Mutate hand wagers to track active bets
    for (const bet of actives) {
      const playerId = bet.user?.id
      const playerIndex = seats.findIndex(seat => seat.playerId === playerId)
      seats[playerIndex].betId = bet.id
    }
  }

  // Create the final hash and start the game
  const playerParts: PlayerHashParts[] = Object.values(rounds).map(
    ({ extraBetParams }) => extraBetParams,
  )
  const { gameRoundHash } = createFinalHash(seed, playerParts)
  if (
    !!opts.hashOverride &&
    typeof opts.hashOverride === 'string' &&
    opts.hashOverride.length > 0
  ) {
    logger('startUserGame', { userId: requests[0].user.id }).warn(
      'Using Hash Override',
      { hashOverride: opts.hashOverride },
    )
  }
  const startedGame = await startGame(
    id,
    opts.hashOverride ?? gameRoundHash,
    seats,
  )

  // Ready, set, play!
  return ClientGameState.fromGameState(startedGame)
}

/**
 * Gets the total bet amount for a set of {@link UserHandMainWagerRequest wagers}, including their side wagers, if any.
 * @param wagers The {@link UserHandMainWagerRequest wagers} to get the total bet amount for.
 * @returns The total bet amount.
 */
function getFullBetAmount(wagers: UserHandMainWagerRequest[]): number {
  const getSideWagerTotal = (wager: UserHandMainWagerRequest): number => {
    if (isUserHandMainWagerWithSides(wager)) {
      return wager.sides.reduce((a, b) => a + b.amount, 0)
    }
    return 0
  }
  return wagers.reduce((a, b) => {
    const sidesTotal = getSideWagerTotal(b)
    return a + (b.amount ?? 0) + sidesTotal
  }, 0)
}

/**
 * Create the final hash for a game round.
 * @param seed The servers hash seed.
 * @param playerParts The player hash parts.
 * @returns The final game round hashes.
 */
export function createFinalHash(
  seed: string,
  playerParts: PlayerHashParts[],
): GameRoundHashes {
  const playerRoundHashes = playerParts.map(
    ({ nonce, roundHash, clientSeed }) =>
      saltWithClientSeed(roundHash, `${clientSeed} - ${nonce}`),
  )
  const gameRoundHash = playerRoundHashes.reduce(
    (pre, cur) => generateHmac(pre, cur),
    seed,
  )
  return {
    gameRoundHash,
    playerRoundHashes,
  }
}

/**
 * Hits a hand in a game of blackjack.
 * @param id The game `id`.
 * @param user The requesting user.
 * @param handIndex The player hand index to hit.
 * @returns The {@link ClientGameState} for the game.
 */
export async function hitUserGame(
  id: string,
  user: User,
  handIndex: number,
): Promise<ClientGameState> {
  const game = await hit(id, user.id, handIndex)
  return ClientGameState.fromGameState(game)
}

/**
 * Stands a hand in a game of blackjack.
 * @param id The game `id`.
 * @param user The requesting user.
 * @param handIndex The player hand index to stand.
 * @returns The {@link ClientGameState} for the game.
 */
export async function standUserGame(
  id: string,
  user: User,
  handIndex: number,
): Promise<ClientGameState> {
  const game = await stand(id, user.id, handIndex)
  return ClientGameState.fromGameState(game)
}

/**
 * Accepts or declines insurance on a hand in a game of blackjack.
 * @param id The game `id`.
 * @param user The requesting {@link User}.
 * @param handIndex The player hand index to stand.
 * @returns The {@link ClientGameState} for the game.
 */
export async function insureUserGame(
  id: string,
  user: User,
  handIndex: number,
  accept: boolean,
): Promise<ClientGameState> {
  const game = await insure(id, user.id, handIndex, accept)
  return ClientGameState.fromGameState(game)
}

/**
 * Double's down a hand in a game of blackjack.
 * @param id The game `id`.
 * @param user The requesting user.
 * @param handIndex The player hand index to hit.
 * @returns The {@link ClientGameState} for the game.
 */
export async function doubleDownUserGame(
  id: string,
  user: User,
  handIndex: number,
): Promise<ClientGameState> {
  const game = await doubleDown(id, user.id, handIndex)
  return ClientGameState.fromGameState(game)
}

/**
 * Splits a hand in a game of blackjack.
 * @param id The game `id`.
 * @param user The requesting user.
 * @param handIndex The player hand index to hit.
 * @returns The {@link ClientGameState} for the game.
 */
export async function splitUserGame(
  id: string,
  user: User,
  handIndex: number,
): Promise<ClientGameState> {
  const game = await split(id, user.id, handIndex)
  return ClientGameState.fromGameState(game)
}
