import { type Response } from 'express'
import { scopedLogger, type LoggerContext } from 'src/system/logger'
import { APIValidationError } from 'src/util/errors'
import { stringOfLength } from './common'
import { YGGDRASIL_PROVIDER_NAME } from './constants'
import { type RemoteApiError } from './games'
import { YggdrasilErrorCodes, type YggdrasilErrorResponse } from './responses'

const logScope = 'errors'
const baseContext = { userId: null }
const logger = (scope: string = logScope, context?: LoggerContext) =>
  scopedLogger(YGGDRASIL_PROVIDER_NAME)(scope, context ?? baseContext)

export const defaultErrorCode = YggdrasilErrorCodes.AnyOtherError
export const defaultHttpErrorCode = 500
export const defaultErrorMessageKey = 'yggdrasil__error'

const ClientBannedErrors: Array<typeof YggdrasilError> = []

/**
 * Checks if an {@link Error} is a client-banned {@link YggdrasilError} or not.
 * @param error The {@link Error} to check.
 * @returns `true` if the {@link Error} is a client-banned {@link YggdrasilError}, `false` otherwise.
 */
function isClientBannedError(error: Error): boolean {
  return ClientBannedErrors.some(errorType => error instanceof errorType)
}

/**
 * Converts a {@link YggdrasilError}'s context into an array of strings, sorted by the context keys.
 * @param context The {@link YggdrasilError}'s context.
 * @returns An array of strings, sorted by the context keys.
 */
function getContextStrings(context: Record<string, unknown>): string[] {
  return Object.entries(context)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([_, value]) => {
      return !value ? '' : value.toString()
    })
}

/**
 * Converts a {@link YggdrasilError} into a {@link APIValidationError} suitable for the client.
 * @param error The {@link YggdrasilError} to convert.
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

  const isYggError = error instanceof YggdrasilError
  if (!isYggError || isClientBannedError(error)) {
    return new APIValidationError(defaultErrorMessageKey)
  }

  if (error instanceof YggdrasilAggregateError && error.errors.length === 1) {
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
 * A Yggdrasil error.
 */
export class YggdrasilError extends Error {
  public readonly code: number = defaultErrorCode
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
    if (error instanceof YggdrasilAggregateError) {
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
    } else if (error instanceof YggdrasilError) {
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
      logger(fallbackScope).error('Unknown Yggdrasil Error', {
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
   * Logs the error and {@link res responds} with a {@link YggdrasilErrorResponse}.
   * @param error The {@link Error} to handle.
   * @param res The {@link Response} to respond with.
   */
  static logAndRespond<E>(error: E, res: Response): void {
    YggdrasilError.logAndIgnore(error)
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.'
    const response: YggdrasilErrorResponse = {
      code: error instanceof YggdrasilError ? error.code : 1,
      msg: stringOfLength(errorMessage, 100, 0),
    }
    res.status(500).json(response)
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

export class YggdrasilAggregateError extends YggdrasilError {
  public override readonly errorMessageKey = 'yggdrasil__error_aggregate'

  constructor(
    gameId: string,
    scope: string,
    public errors: YggdrasilError[],
  ) {
    super('Yggdrasil Aggregate Error', gameId, scope, { errors })
  }
}

export class YggdrasilInvalidGameIdError extends YggdrasilError {
  public override readonly httpCode: number = 400
  public override readonly errorMessageKey = 'yggdrasil__error_invalid_game_id'

  constructor(gameId: string, scope: string) {
    super('Yggdrasil Game Id Invalid', gameId, scope)
  }
}

export class YggdrasilRemoteError extends YggdrasilError {
  public override readonly httpCode: number = 500
  public override readonly errorMessageKey = 'yggdrasil__error_remote_api'

  constructor(error: RemoteApiError, scope: string) {
    super('Yggdrasil Remote Error', 'N/A', scope, { ...error })
  }
}

export class YggdrasilDisabledError extends YggdrasilError {
  public override readonly httpCode: number = 500
  public override readonly errorMessageKey = 'yggdrasil__error_disabled'

  constructor(scope: string) {
    super('Yggdrasil Is Disabled', 'N/A', scope, {})
  }
}

export class YggdrasilInvalidGameError extends YggdrasilError {
  public override readonly httpCode: number = 500
  public override readonly errorMessageKey = 'yggdrasil__error_invalid_game'

  constructor(scope: string) {
    super('Yggdrasil Sent Invalid Games', 'N/A', scope, {})
  }
}

export class YggdrasilInvalidSessionTokenError extends YggdrasilError {
  public override readonly code = YggdrasilErrorCodes.NotLoggedIn
  public override readonly httpCode: number = 500

  constructor(token: string, scope: string) {
    super('Yggdrasil Sent An Invalid Session Token', 'N/A', scope, { token })
  }
}

export class YggdrasilInvalidOrgError extends YggdrasilError {
  public override readonly code = YggdrasilErrorCodes.AnyOtherError
  public override readonly httpCode: number = 500

  constructor(org: string, scope: string) {
    super('Yggdrasil Sent An Invalid Org', 'N/A', scope, { org })
  }
}

export class YggdrasilInvalidOpError extends YggdrasilError {
  public override readonly code = YggdrasilErrorCodes.AnyOtherError
  public override readonly httpCode: number = 500

  constructor(operation: string, scope: string) {
    super('The Operation Is Not Valid', 'N/A', scope, { operation })
  }
}
