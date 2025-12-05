import { type UpdateWriteOpResult } from 'mongoose'

import { scopedLogger, type LoggerContext } from 'src/system/logger'
import { APIValidationError } from 'src/util/errors'
import { BLACKJACK_GAME_NAME } from './constants'
import {
  getHandActionTypeName,
  type HandActionType,
  type HandWagerType,
} from './player'

const logScope = 'errors'
const baseContext = { userId: null }
const logger = (scope: string = logScope, context?: LoggerContext) =>
  scopedLogger(BLACKJACK_GAME_NAME)(scope, context ?? baseContext)

export const defaultHttpErrorCode = 500
export const defaultErrorMessageKey = 'blackjack__error'

/**
 * Checks if a {@link Error} is a client-banned {@link BlackjackError} or not.
 * @param error The {@link Error} to check.
 * @returns `true` if the {@link Error} is a client-banned {@link BlackjackError}, `false` otherwise.
 */
function isClientBannedError(error: Error): boolean {
  return (
    error instanceof BlackjackUpsertFailedError ||
    error instanceof BlackjackMutexError
  )
}

/**
 * Converts a {@link BlackjackError}'s context into an array of strings, sorted by the context keys.
 * @param context The {@link BlackjackError}'s context.
 * @returns An array of strings, sorted by the context keys.
 */
function getContextStrings(context: Record<string, unknown>): string[] {
  return Object.entries(context)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => {
      const finalValue = (() => {
        if (key === 'action' && typeof value === 'number') {
          return getHandActionTypeName(value) ?? 'Unsupported'
        }
        return value
      })()
      return !finalValue ? '' : finalValue.toString()
    })
}

/**
 * Converts a {@link BlackjackError} into a {@link APIValidationError} suitable for the client.
 * @param error The {@link BlackjackError} to convert.
 * @param scope The scope to log the error under.
 * @returns A {@link APIValidationError} suitable for the client.
 */
export function getClientError<E>(
  error: E,
  scope?: string,
): APIValidationError {
  const isAnyError = error instanceof Error
  if (!isAnyError) {
    logger(scope ?? logScope).error('An Unknown Non-Error was thrown!', {
      error,
    })
    return new APIValidationError(defaultErrorMessageKey)
  }

  if (error instanceof APIValidationError) {
    return error
  }

  const isBlackjackError = error instanceof BlackjackError
  if (!isBlackjackError || isClientBannedError(error)) {
    return new APIValidationError(defaultErrorMessageKey)
  }

  if (error instanceof BlackjackAggregateError && error.errors.length === 1) {
    const [singleError] = error.errors
    const errorMessageKey = singleError.errorMessageKey ?? singleError.message
    return new APIValidationError(
      errorMessageKey,
      getContextStrings({ ...singleError.context, gameId: singleError.gameId }),
    )
  }
  return new APIValidationError(
    error.errorMessageKey,
    getContextStrings({ ...error.context, gameId: error.gameId }),
  )
}

/**
 * A Blackjack error.
 */
export class BlackjackError extends Error {
  public readonly httpCode: number = defaultHttpErrorCode
  public readonly errorMessageKey: string = defaultErrorMessageKey

  constructor(
    message: string,
    public gameId: string,
    public scope?: string,
    public context: Record<string, unknown> = {},
  ) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }

  /**
   * Logs the error and returns the same error.
   */
  static logAndReturn<E>(error: E, scope?: string): E {
    const fallbackScope = scope ?? logScope
    if (error instanceof BlackjackAggregateError) {
      const logErrors = error.errors.map(err => ({
        stack: err.stack,
        message: err.message,
        context: err.context,
      }))
      logger(error.scope ?? fallbackScope).error(error.message, {
        gameId: error.gameId,
        ...error.context,
        errors: logErrors,
      })
    } else if (error instanceof BlackjackError) {
      logger(error.scope ?? fallbackScope).error(error.message, {
        gameId: error.gameId,
        ...error.context,
      })
    } else {
      const finalError =
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              cause: error.cause,
              name: error.name,
            }
          : {
              name: 'Error',
              ...(typeof error === 'object' ? error : { message: error }),
            }
      logger(fallbackScope).error('Unknown Blackjack Error', {
        error: finalError,
      })
    }
    return error
  }

  /**
   * Logs the error.
   */
  static logAndIgnore<E>(error: E): void {
    this.logAndReturn(error)
  }

  /**
   * Logs the error and returns a {@link APIValidationError} suitable for the client.
   * @param error The {@link Error} to handle.
   * @param scope The scope to log the error under.
   * @returns A {@link APIValidationError} suitable for the client.
   */
  static logAndReturnForClient<E>(
    error: E,
    scope?: string,
  ): APIValidationError {
    const loggedError = this.logAndReturn(error, scope)
    const finalError = getClientError(loggedError, scope)
    return finalError
  }
}

export class BlackjackAggregateError extends BlackjackError {
  public override readonly errorMessageKey = 'blackjack__error_aggregate'

  constructor(
    gameId: string,
    scope: string,
    public errors: BlackjackError[],
  ) {
    super('Blackjack Aggregate Error', gameId, scope, { errors })
  }
}

export class BlackjackGameNotFoundError extends BlackjackError {
  public override readonly httpCode: number = 404
  public override readonly errorMessageKey = 'blackjack__error_game_not_found'

  constructor(gameId: string, scope: string) {
    super('Blackjack Game Not Found', gameId, scope)
  }
}

export class BlackjackInvalidGameIdError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey = 'blackjack__error_invalid_game_id'

  constructor(gameId: string, scope: string) {
    super('Blackjack Game Id Invalid', gameId, scope)
  }
}

export class BlackjackUpsertFailedError extends BlackjackError {
  public override readonly errorMessageKey = 'blackjack__error_upsert_failure'

  constructor(gameId: string, scope: string, result: UpdateWriteOpResult) {
    super('Blackjack Upsert Failed', gameId, scope, { result })
  }
}

export class BlackjackPlayerNotFoundError extends BlackjackError {
  public override readonly httpCode: number = 404
  public override readonly errorMessageKey = 'blackjack__error_player_not_found'

  constructor(gameId: string, scope: string, playerId: string) {
    super('Blackjack Player Not Found', gameId, scope, { playerId })
  }
}

export class BlackjackNoPlayersError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey = 'blackjack__error_no_players'

  constructor(gameId: string, scope: string) {
    super('Blackjack No Players', gameId, scope)
  }
}

export class BlackjackInvalidHandError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey = 'blackjack__error_invalid_hand'

  constructor(
    gameId: string,
    scope: string,
    playerId: string,
    handIndex: number,
    action?: HandActionType,
  ) {
    super('Blackjack Invalid Hand', gameId, scope, {
      action,
      handIndex,
      playerId,
    })
  }
}

export class BlackjackMissingRoundIdError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey = 'blackjack__error_missing_round_id'

  constructor(gameId: string, scope: string) {
    super('Blackjack Missing Round ID Error', gameId ?? 'N/A', scope)
  }
}

export class BlackjackSideBetCalculationError extends BlackjackError {
  public override readonly errorMessageKey =
    'blackjack__error_side_bet_calculation'

  constructor(type: HandWagerType, scope: string) {
    super('Blackjack Side Bet Calculation Error', 'N/A', scope, { type })
  }
}

export class BlackjackBadTableDealerError extends BlackjackError {
  public override readonly errorMessageKey = 'blackjack__error_bad_table_dealer'

  constructor(gameId: string, scope: string) {
    super('Blackjack Wrong Dealer Position', gameId ?? 'N/A', scope)
  }
}

export class BlackjackDealerStatusError extends BlackjackError {
  public override readonly errorMessageKey =
    'blackjack__error_dealer_without_status'

  constructor(gameId: string, scope: string) {
    super('Blackjack Dealer Hand Has No Status', gameId ?? 'N/A', scope)
  }
}

export class BlackjackNonGamePlayerError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey = 'blackjack__error_non_game_player'

  constructor(gameId: string, scope: string, playerId: string) {
    super('Blackjack Non-Game-Player Error', gameId, scope, { playerId })
  }
}

export class BlackjackMissingPlayerHandError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey =
    'blackjack__error_missing_player_hand'

  constructor(gameId: string, scope: string) {
    super('Blackjack Missing Player Hand Error', gameId, scope)
  }
}

export class BlackjackMissingGameHashError extends BlackjackError {
  public override readonly errorMessageKey =
    'blackjack__error_missing_game_hash'

  constructor(gameId: string, scope: string) {
    super('Blackjack Missing Game Hash Error', gameId, scope)
  }
}

export class BlackjackMissingGameSeedError extends BlackjackError {
  public override readonly errorMessageKey =
    'blackjack__error_missing_game_seed'

  constructor(gameId: string, scope: string) {
    super('Blackjack Missing Game Seed Error', gameId, scope)
  }
}

export class BlackjackGameShoeExhaustedError extends BlackjackError {
  public override readonly errorMessageKey =
    'blackjack__error_game_shoe_exhausted'

  constructor(gameId: string, scope: string) {
    super('Blackjack Game Shoe Exhausted Error', gameId, scope)
  }
}

export class BlackjackInvalidActionError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey = 'blackjack__error_invalid_action'

  constructor(
    gameId: string,
    scope: string,
    playerId: string,
    handIndex: number,
    action: HandActionType,
  ) {
    super('Blackjack Invalid Action', gameId, scope, {
      action,
      handIndex,
      playerId,
    })
  }
}
export class BlackjackWrongPlayerHandError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey =
    'blackjack__error_wrong_player_hand'

  constructor(
    gameId: string,
    scope: string,
    playerId: string,
    activePlayerId: string,
    handIndex: number,
    activeHandIndex: number,
  ) {
    super('Blackjack Wrong Player Hand', gameId, scope, {
      playerId,
      activePlayerId,
      handIndex,
      activeHandIndex,
    })
  }
}

export class BlackjackMutexError extends BlackjackError {
  public override readonly errorMessageKey = 'blackjack__error_mutex'

  constructor(gameId: string, scope: string) {
    super('Blackjack Mutex Error', gameId, scope, {
      details: 'Failed to acquire game mutex lock.',
    })
  }
}

export class BlackjackInvalidWagersError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey = 'blackjack__error_invalid_wagers'

  constructor(gameId: string, scope: string) {
    super('Blackjack Invalid Wagers Error', gameId, scope)
  }
}

export class BlackjackNoUsableWagerError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey = 'blackjack__error_no_usable_wager'

  constructor(gameId: string, scope: string) {
    super('Blackjack No Usable Wager Error', gameId, scope)
  }
}

export class BlackjackNoActiveWagerError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey = 'blackjack__error_no_active_wager'

  constructor(
    gameId: string,
    playerId: string,
    handIndex: number,
    betId: string,
    scope: string,
  ) {
    super('Blackjack No Active Wager Error', gameId, scope, {
      betId,
      handIndex,
      playerId,
    })
  }
}

export class BlackjackActiveWagerUpdateError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey =
    'blackjack__error_active_wager_update'

  constructor(
    gameId: string,
    playerId: string,
    handIndex: number,
    betId: string,
    scope: string,
  ) {
    super('Blackjack Active Wager Update Error', gameId, scope, {
      betId,
      handIndex,
      playerId,
    })
  }
}

export class BlackjackSplitWagerError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey = 'blackjack__error_split_wager'

  constructor(
    gameId: string,
    playerId: string,
    handIndex: number,
    betId: string,
    scope: string,
  ) {
    super('Blackjack Split Wager Error', gameId, scope, {
      betId,
      handIndex,
      playerId,
    })
  }
}

export class BlackjackInsureWagerError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey = 'blackjack__error_insure_wager'

  constructor(
    gameId: string,
    playerId: string,
    handIndex: number,
    betId: string,
    scope: string,
  ) {
    super('Blackjack Insure Wager Error', gameId, scope, {
      betId,
      handIndex,
      playerId,
    })
  }
}

export class BlackjackDoubleDownWagerError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey =
    'blackjack__error_double_down_wager'

  constructor(
    gameId: string,
    playerId: string,
    handIndex: number,
    betId: string,
    scope: string,
  ) {
    super('Blackjack Double-Down Wager Error', gameId, scope, {
      betId,
      handIndex,
      playerId,
    })
  }
}

export class BlackjackAlreadyInsuredWagerError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey =
    'blackjack__error_already_insure_wager'

  constructor(
    gameId: string,
    playerId: string,
    handIndex: number,
    betId: string,
    scope: string,
  ) {
    super('Blackjack Already Insured Wager Error', gameId, scope, {
      betId,
      handIndex,
      playerId,
    })
  }
}

export class BlackjackInsufficientFundsError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey = 'blackjack__error_wager_nsf'

  constructor(
    gameId: string,
    playerId: string,
    handIndex: number,
    betId: string,
    scope: string,
  ) {
    super('Blackjack Insufficient Funds Error', gameId, scope, {
      betId,
      handIndex,
      playerId,
    })
  }
}

export class BlackjackInvalidCloseoutError extends BlackjackError {
  public override readonly errorMessageKey = 'blackjack__error_invalid_closeout'

  constructor(gameId: string, scope: string) {
    super('Blackjack Invalid Closeout Error', gameId, scope, {})
  }
}

export class BlackjackInvalidRequestError extends BlackjackError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey = 'blackjack__error_invalid_request'

  constructor(gameId: string, scope: string) {
    super('Blackjack Invalid Request Error', gameId, scope)
  }
}
