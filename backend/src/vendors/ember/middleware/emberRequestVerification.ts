import { type Request, type Response, type NextFunction } from 'express'

import { emberLogger, verifyRequest } from '../lib'
import { isEmberEncryptionString } from '../types'

// Only forward the valid requests
export const verifyEmberRequestMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const logger = emberLogger('verifyEmberRequestMiddleware', { userId: null })
  const { 'x-signature': signature } = req.headers

  if (!isEmberEncryptionString(signature)) {
    logger.debug('Invalid signature', { signature })
    res.status(401).send('Invalid signature')
    return
  }

  const iv = signature.split(':')[1]
  const validRequest = verifyRequest(req.body, signature, iv)
  if (!validRequest) {
    logger.debug('Unverified request', {
      request: req.body,
      signature,
    })
    res.status(401).send('Unauthorized request')
    return
  }

  next()
}
