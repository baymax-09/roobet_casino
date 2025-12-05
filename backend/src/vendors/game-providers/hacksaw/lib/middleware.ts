import { type ErrorRequestHandler } from 'express'

import { HacksawError, type HacksawCallbackError } from './errors'
import { hacksawLogger } from './logger'

// Do not change the params of this function, all four must be present for
// express to treat this as an error request handler... stupid I know.
// eslint-disable-next-line unused-imports/no-unused-vars
export const hacksawErrorMiddleware: ErrorRequestHandler = (
  error,
  req,
  res,
  next,
) => {
  if (error instanceof Error) {
    hacksawLogger('hacksawErrorMiddleware', { userId: null }).error(
      'error',
      {},
      error,
    )
  }

  const response: HacksawCallbackError = {
    statusCode: error instanceof HacksawError ? error.getType() : 1,
    statusMessage:
      error instanceof Error ? error.message : 'An unknown error occurred.',
  }

  // Hacksaw expects a 200 for error responses.
  res.status(200).json(response)
}
