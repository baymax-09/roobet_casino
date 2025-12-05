import jwt from 'jsonwebtoken'
import { type RequestHandler } from 'express'

import { config } from 'src/system'

export const validateRequestMiddleWare: RequestHandler = (req, res, next) => {
  if (req.headers['x-api-key'] !== config.fasttrack.secret && !config.isLocal) {
    res.status(401).send()
    return
  }

  next()
}

export function generateAuthTokenFastrack(userId: string) {
  const token = jwt.sign(
    { id: userId, service: 'fasttrack' },
    config.jwt.secret,
    {
      algorithm: 'HS256',
      expiresIn: '7 days',
    },
  )
  return token
}
