import { type ErrorRequestHandler } from 'express'

import { YggdrasilError } from '../types'

// Do not change the params of this function, all four must be present for
// express to treat this as an error request handler... stupid I know.
// eslint-disable-next-line unused-imports/no-unused-vars
export const yggdrasilErrorMiddleware: ErrorRequestHandler = (
  error,
  req,
  res,
  next,
) => {
  YggdrasilError.logAndRespond(error, res)
}
