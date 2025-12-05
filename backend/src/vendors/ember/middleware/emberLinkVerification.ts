import { type Request, type Response, type NextFunction } from 'express'

import { decrypt, emberLogger } from '../lib'
import { isEmberEncryptionString } from '../types'

export const verifyEmberLinkMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const logger = emberLogger('verifyEmberLinkMiddleware', { userId: null })
  const { emberId } = req.body

  if (!isEmberEncryptionString(emberId)) {
    logger.debug('Link body does not match expected type', { emberId })
    res.status(401).send('Invalid encryption string')
    return
  }

  const [encrypted, iv] = emberId.split(':')
  let decrypted = ''
  try {
    decrypted = decrypt(encrypted, iv)
  } catch (error) {
    logger.error('Failed to decrypt data', {
      encrypted,
      iv,
      error: { message: error.message, code: error.code },
    })
    res.status(500).send('Failure in data decryption')
    return
  }
  try {
    const { ember_user_id } = JSON.parse(decrypted)
    if (!ember_user_id) {
      logger.debug('Encrypted data does not contain ember_user_id', {
        decrypted,
      })
      res.status(401).send('Encrypted data does not contain ember_user_id')
      return
    }
    req.context = {
      ...req.context,
      emberUserId: ember_user_id,
    }
  } catch (error) {
    logger.error('Failed to parse decrypted data', { decrypted, error })
    res.status(401).send('Invalid encryption payload format')
    return
  }

  next()
}
