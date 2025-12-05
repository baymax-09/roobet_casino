export interface SlotegratorCallbackError {
  error_code: 'INSUFFICIENT_FUNDS' | 'INTERNAL_ERROR'
  error_description: string
}

export class SlotegratorError extends Error {
  type: SlotegratorCallbackError['error_code']

  constructor(
    message: string,
    type: SlotegratorCallbackError['error_code'] = 'INTERNAL_ERROR',
  ) {
    super(message)

    this.type = type

    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this, this.constructor)
  }

  getType(): SlotegratorCallbackError['error_code'] {
    return this.type
  }
}

export class FSMError extends Error {}
