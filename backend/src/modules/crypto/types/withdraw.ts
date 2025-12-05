export class WithdrawError extends Error {
  code?: number

  constructor(message: string, code = 99999) {
    super(message)

    this.code = code

    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}
