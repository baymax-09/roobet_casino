import { type RequestHandler, type ErrorRequestHandler } from 'express'

import { SlotegratorError, type SlotegratorCallbackError } from './errors'
import { calculateHMACSignature } from './auth'
import { slotegratorLogger } from './logger'

// Do not change the params of this function, all four must be present for
// express to treat this as an error request handler... stupid I know.
// eslint-disable-next-line unused-imports/no-unused-vars
export const slotegratorErrorMiddleware: ErrorRequestHandler = (
  error,
  req,
  res,
  next,
) => {
  if (error instanceof Error) {
    slotegratorLogger('slotegratorErrorMiddleware', { userId: null }).error(
      'error',
      {},
      error,
    )
  }

  const response: SlotegratorCallbackError = {
    error_code:
      error instanceof SlotegratorError ? error.getType() : 'INTERNAL_ERROR',
    error_description:
      error instanceof Error ? error.message : 'An unknown error occurred.',
  }

  // Slotegrator expects a 200 for error responses.
  res.status(200).json(response)
}

export const makeValidateSignatureMiddleware =
  (merchantKey: string): RequestHandler =>
  (req, res, next) => {
    const payload = {
      'X-Merchant-Id': req.headers['x-merchant-id'],
      'X-Timestamp': req.headers['x-timestamp'],
      'X-Nonce': req.headers['x-nonce'],
      ...req.body,
    }

    const signature = calculateHMACSignature(merchantKey, payload)

    if (signature !== req.headers['x-sign']) {
      res.status(403).send('INTERNAL_ERROR')
      return
    }

    next()
  }
