/**
 * LEGACY ERROR CODES
 * 1001 - legacy error used on the frontend to indicate no retry
 * 1002 - user region restricted
 */

class BaseError extends Error {
  override message: string
  args: string[]

  constructor(message: string, args: string[] = []) {
    super()
    this.message = message
    this.args = args
  }
}

export class InternalError extends BaseError {}

export class LockedProcessError extends BaseError {}

export class APIValidationError extends BaseError {
  code?: number
  options: { field?: string }

  /**
   * @param m error message that will be translated
   * @param args template values for i18n translation
   */
  constructor(
    message: string,
    args: string[] = [],
    options: { field?: string } = {},
  ) {
    super(message, args)

    this.options = options

    /*
     * Legacy error code, only 1001 is used on the frontend to indicate no retry
     * TODO refactor this when we redo our error handling
     */
    if (message === 'bet__not_enough_balance') {
      this.code = 1001
    }
  }
}
