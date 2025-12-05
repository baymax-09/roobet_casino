export enum ErrorCodes {
  Default = 98999,
}

export class RippleAPIError extends Error {
  code: number

  constructor(message: string, code: number = ErrorCodes.Default) {
    super(message)

    this.code = code

    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}
