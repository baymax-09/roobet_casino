import { type Request, type Response, type NextFunction } from 'express'

import { emberLogger } from '../lib'

export const verifyRequestParamsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const logger = emberLogger('verifyRequestParamsMiddleware', { userId: null })
  const { ember_user_id, amount_usd } = req.body
  if (!ember_user_id || typeof ember_user_id !== 'string') {
    logger.error('Invalid param: [ember_user_id]', { ember_user_id })
    res.status(400).send({ message: 'Invalid param: [ember_user_id]' })
    return
  }
  if (!amount_usd || typeof amount_usd !== 'number') {
    logger.error('Invalid param: [amount_usd]', { amount_usd })
    res.status(400).send({ message: 'Invalid param: [amount_usd]' })
    return
  }

  next()
}
