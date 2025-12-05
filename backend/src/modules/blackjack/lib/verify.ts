import type mongoose from 'mongoose'
import { VerificationErrorMap } from 'src/modules/game/lib/errors'
import { getCurrentRoundForUser } from 'src/modules/game/lib/provably_fair/userGenerated'
import { getRoundTableForGame } from 'src/modules/game/lib/round'
import {
  type GameRound,
  type VerificationError,
  type VerificationResults,
  type VerifyData,
} from 'src/modules/game/types'
import { getUserById } from 'src/modules/user'
import { type User } from 'src/modules/user/types'
import { promisify } from 'util'
import * as zlib from 'zlib'
import { getGamesForPlayer } from '../documents/blackjackGames'
import { getHistoryByBetId } from '../documents/blackjackHistory'
import {
  BLACKJACK_GAME_NAME,
  BLACKJACK_VERIFICATION_ERROR_CODE,
  CardSuitType,
  CardValueType,
  GameStatus,
  isDealerSeat,
  isHandActionInsurance,
  isHandActionWithShoe,
  isPlayerSeat,
  isUserHandMainWagerWithSides,
  type Card,
  type ClientGameState,
  type GameState,
  type PlayerSeat,
} from '../types'
import { getDealerHand, lastShoeIndexFromGame } from '../utils'
import { getProvableShoe } from './shoe'

export const BlackjackVerificationErrors = {
  ...VerificationErrorMap,
  GAME_STILL_ACTIVE: {
    message: 'blackjack__error_game_still_active',
    code: BLACKJACK_VERIFICATION_ERROR_CODE + 1,
  },
  GAME_TOO_OLD: {
    message: 'blackjack__error_game_too_old',
    code: BLACKJACK_VERIFICATION_ERROR_CODE + 2,
  },
  GAME_INCOMPLETE: {
    message: 'blackjack__error_game_incomplete',
    code: BLACKJACK_VERIFICATION_ERROR_CODE + 3,
  },
  GAME_MISSING_HASH: {
    message: 'blackjack__error_game_missing_hash',
    code: BLACKJACK_VERIFICATION_ERROR_CODE + 4,
  },
  GAME_MISSING_USERS: {
    message: 'blackjack__error_game_missing_users',
    code: BLACKJACK_VERIFICATION_ERROR_CODE + 5,
  },
  GAME_MISSING_USER_SEAT: {
    message: 'blackjack__error_game_missing_user_seat',
    code: BLACKJACK_VERIFICATION_ERROR_CODE + 6,
  },
  GAME_MISSING_USER_ROUNDS: {
    message: 'blackjack__error_game_missing_user_rounds',
    code: BLACKJACK_VERIFICATION_ERROR_CODE + 7,
  },
  GAME_MISSING_USER_ROUND: {
    message: 'blackjack__error_game_missing_user_round',
    code: BLACKJACK_VERIFICATION_ERROR_CODE + 8,
  },
  GAME_MISSING_DEALER: {
    message: 'blackjack__error_game_missing_dealer',
    code: BLACKJACK_VERIFICATION_ERROR_CODE + 9,
  },
}

const CardValueMap = {
  [CardValueType.Two]: '2',
  [CardValueType.Three]: '3',
  [CardValueType.Four]: '4',
  [CardValueType.Five]: '5',
  [CardValueType.Six]: '6',
  [CardValueType.Seven]: '7',
  [CardValueType.Eight]: '8',
  [CardValueType.Nine]: '9',
  [CardValueType.Ten]: '10',
  [CardValueType.Jack]: 'J',
  [CardValueType.Queen]: 'Q',
  [CardValueType.King]: 'K',
  [CardValueType.Ace]: 'A',
  [CardValueType.Hidden]: '🂠',
}

const CardSuitMap = {
  [CardSuitType.Clubs]: '♣️',
  [CardSuitType.Diamonds]: '♦️',
  [CardSuitType.Hearts]: '♥️',
  [CardSuitType.Spades]: '♠️',
  [CardSuitType.Hidden]: '🂠',
}

/**
 * Verify a game of Blackjack.
 * @param data The {@link VerifyData<'blackjack'>} instance to verify.
 * @returns A {@link VerificationResults} instance if the verification was successful, or a {@link VerificationError} instance if the verification failed.
 */
export async function verifyBlackjack(
  data: VerifyData<typeof BLACKJACK_GAME_NAME>,
): Promise<VerificationResults | VerificationError> {
  // Make sure there are no active games
  const activeGames = await getGamesForPlayer(data.user.id)
  if (activeGames.length > 0) {
    return BlackjackVerificationErrors.GAME_STILL_ACTIVE
  }

  // Make sure the associated game is complete
  const game = await getHistoryByBetId(data.betId)
  if (!game || game.status !== GameStatus.Complete) {
    return BlackjackVerificationErrors.GAME_INCOMPLETE
  }
  if (!game.hash || game.hash.length === 0) {
    return BlackjackVerificationErrors.GAME_MISSING_HASH
  }

  // Get the Non-Dealer players from the table
  const realPlayers = game.players.filter(isPlayerSeat)
  const requestedSeat = realPlayers.find(
    player => player.playerId === data.user.id,
  )
  const users = await getAllPlayerUsers(realPlayers, data)

  // Verify we got all non-dealer players
  if (users.length !== game.players.length - 1) {
    return BlackjackVerificationErrors.GAME_MISSING_USERS
  }

  // Verify we have the requesting users seat
  if (!requestedSeat) {
    return BlackjackVerificationErrors.GAME_MISSING_USER_SEAT
  }

  // Get the associated user game rounds
  const gameRoundTable = getRoundTableForGame(BLACKJACK_GAME_NAME)
  const userRounds = await getValidUserRounds(users, gameRoundTable)

  // Verify we got all the rounds
  if (userRounds.length !== users.length) {
    return BlackjackVerificationErrors.GAME_MISSING_USER_ROUNDS
  }

  const playerParts = buildPlayerParts(userRounds)
  const requestingUserInfo = playerParts[data.user.id]
  if (!requestingUserInfo) {
    return BlackjackVerificationErrors.GAME_MISSING_USER_ROUND
  }

  const handResults = buildHandResults(requestedSeat)
  const gameShoe = getProvableShoe(game.hash)
  const lastUsedShoeIndex = lastShoeIndexFromGame(game)
  const shoeUsed = gameShoe
    .slice(0, lastUsedShoeIndex + 1)
    .map(getCardShorthand)
  const shoeLeft = gameShoe.slice(lastUsedShoeIndex + 1).map(getCardShorthand)
  const dealerHand = getDealerHand(game)
  const dealerCards = dealerHand.cards.map(getCardShorthand)

  const actionsHash = await buildActionHash(game)

  const result = {
    shoeUsed,
    shoeLeft,
    handResults,
    dealerCards,
    actionsHash,
  }

  return {
    result,
    serverSeed: game.seed,
    hashedServerSeed: game.hash,
    nonce: requestingUserInfo.nonce,
    clientSeed: requestingUserInfo.hash,
  }
}

/**
 * The shape of hand details for a {@link VerificationResults} instance.
 */
interface VerificationHand {
  outcome: string
  cards: string[]
  value: number
  wager: {
    amount: number
    sides: Array<{
      type: string
      amount: number
      outcome: string
    }>
  }
}

/**
 * Get all the {@link User users} associated with a game.
 * @param realPlayers The non-dealer {@link PlayerSeat players} in the game.
 * @param data The {@link VerifyData<"blackjack"> verify data} instance to use for verification.
 * @returns The {@link User users} who played in the game.
 */
async function getAllPlayerUsers(
  realPlayers: PlayerSeat[],
  data: VerifyData<'blackjack'>,
) {
  return (
    await Promise.all(
      realPlayers.map(player => {
        if (player.playerId === data.user.id) {
          return Promise.resolve(data.user)
        }
        return getUserById(player.playerId)
      }),
    )
  ).filter(isUser)
}

/**
 * Get the current round for the {@link users}.
 * @param users The {@link User users} to get the current round for.
 * @param gameRoundTable The game round table to use for the query.
 * @returns The {@link GameRound game round} for each {@link User user}.
 */
async function getValidUserRounds(
  users: User[],
  gameRoundTable: mongoose.Model<any>,
) {
  return (
    await Promise.all(
      users.map(user =>
        getCurrentRoundForUser(user, BLACKJACK_GAME_NAME, gameRoundTable),
      ),
    )
  ).filter(isValidRoundWithId)
}

/**
 * Build a map of {@link GameRound game rounds} keyed by {@link User user.id id}.
 * @param userRounds The {@link GameRound game rounds} to build the map from.
 * @returns A map of {@link GameRound game rounds} keyed by {@link User.id user id}.
 */
function buildPlayerParts(userRounds: GameRound[]): Record<string, GameRound> {
  return userRounds.reduce((pre, cur) => {
    return {
      ...pre,
      [cur.userId]: cur,
    }
  }, {})
}

/**
 * Build the {@link VerificationHand hand results} for a {@link PlayerSeat player seat}.
 * @param requestedSeat The {@link PlayerSeat player seat} to build the {@link VerificationHand hand results} for.
 * @returns The {@link VerificationHand hand results} for the {@link PlayerSeat player seat}.
 */
function buildHandResults(
  requestedSeat: PlayerSeat,
): Record<string, VerificationHand> {
  return requestedSeat.hands.reduce((pre, cur, ndx) => {
    return {
      ...pre,
      [ndx.toString()]: {
        outcome: cur.status.outcome,
        cards: cur.cards.map(getCardShorthand),
        value: cur.status.value,
        wager: {
          amount: cur.wager.amount,
          sides: isUserHandMainWagerWithSides(cur.wager)
            ? cur.wager.sides.map(side => ({
                type: side.type,
                amount: side.amount,
                outcome: side.outcome,
              }))
            : [],
        },
      },
    }
  }, {})
}

/**
 * Build the action hash for a {@link GameState game}.
 * @param game The {@link GameState game} to build the action hash for.
 * @returns The action hash for the {@link GameState game}.
 */
export async function buildActionHash(game: GameState | ClientGameState) {
  const actionString = buildActionHashRaw(game)
  return await compressString(actionString)
}

/**
 * Build the raw, uncompressed action hash for a {@link GameState game}.
 * @param game The {@link GameState game} to build the action hash for.
 * @returns The action hash for the {@link GameState game}.
 */
export function buildActionHashRaw(game: GameState | ClientGameState) {
  return game.players
    .map((seat, seatNdx) => {
      const seatMarker = isDealerSeat(seat) ? 'D0' : `P${seatNdx}`
      const hands = seat.hands
        .map((hand, handNdx) => {
          const handMarker = `H${handNdx}`
          const actions = hand.actions
            .map(action => {
              let actionMeta: string = ''
              if (isHandActionWithShoe(action)) {
                actionMeta = `S${action.shoeIndex}`
              }
              if (isHandActionInsurance(action)) {
                actionMeta = `I${action.accept ? '0' : '1'}`
              }
              return `A${action.type}${action.timestamp.valueOf()}${actionMeta}`
            })
            .join('')
          return [handMarker, actions].join('')
        })
        .join('')
      return [seatMarker, hands].join('')
    })
    .join('')
}

// Promisify the brotliCompress function for async/await usage
const brotliCompressAsync = promisify(zlib.brotliCompress)

/**
 * Compress a string using the Brotli algorithm.
 * @param value The string to compress.
 * @returns The compressed string.
 */
async function compressString(value: string): Promise<string> {
  const inputBuffer = Buffer.from(value, 'utf-8')
  const compressedBuffer = await brotliCompressAsync(inputBuffer)
  // Return the compressed data as a base64 string
  return compressedBuffer.toString('base64')
}

/**
 * Get the shorthand representation of a {@link Card} instance.
 * @param card The {@link Card} instance to get the shorthand representation of.
 * @returns The shorthand representation of the {@link Card} instance.
 * @example
 * ```ts
 * const card = {
 *  value: CardValueType.Ace,
 *  suit: CardSuitType.Spades,
 * }
 * const shorthand = getCardShorthand(card)
 * console.log(shorthand) // A♠️
 * ```
 */
export function getCardShorthand(card: Card): string {
  return `${CardValueMap[card.value]}${CardSuitMap[card.suit]}`
}

/**
 * Identifies a valid {@link GameRound} instance.
 * @param round The object to check.
 * @returns `true` if the object is a valid {@link GameRound} instance, otherwise `false`.
 */
function isValidRoundWithId(round: GameRound | null): round is GameRound {
  return !!round && !!round.id && !!round.hash && round.nonce !== undefined
}

/**
 * Identifies a valid {@link User} instance.
 * @param obj The object to check.
 * @returns `true` if the object is a valid {@link User} instance, otherwise `false`.
 */
function isUser(obj: any): obj is User {
  return !!obj && 'id' in obj && typeof obj.id === 'string'
}
