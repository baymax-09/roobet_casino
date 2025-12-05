export enum HacksawErrorCodes {
  Success = 0,
  GeneralServerError = 1,
  InvalidUserOrTokenExpired = 2,
  InvalidCurrencyForUser = 3,
  InvalidPartnerCode = 4,
  InsufficientFunds = 5,
  AccountLocked = 6,
  AccountDisabled = 7,
  GamblingLimitExceeded = 8,
  TimeLimitExceeded = 9,
  SessionTimeout = 10,
  GeneralErrorNoRollbackRequired = 11,
  InvalidAction = 12,
}

export interface HacksawCallbackError {
  statusCode: HacksawErrorCodes
  statusMessage: string
}

export class HacksawError extends Error {
  type: HacksawCallbackError['statusCode']

  constructor(
    message: string,
    type: HacksawCallbackError['statusCode'] = HacksawErrorCodes.GeneralServerError,
  ) {
    super(message)

    this.type = type

    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this, this.constructor)
  }

  getType(): HacksawCallbackError['statusCode'] {
    return this.type
  }
}

export class FSMError extends Error {}
