export class GameResolutionError extends Error {
  code: number

  constructor(message: string, code = 99999) {
    super(message)

    this.code = code

    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

export class GameVerificationError extends Error {
  code: number

  constructor(message: string, code = 99999) {
    super(message)

    this.code = code

    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}
