import { type RequestHandler } from 'express'
import crypto from 'crypto'
import { config } from 'src/system'

export const validateAuthorizationToken: RequestHandler = (req, res, next) => {
  const privateKeyHashed = crypto
    .createHash('sha256')
    .update(config.paymentiq.privateKey)
    .digest('hex')
  const token = `Bearer ${privateKeyHashed}`

  const { authorization } = req.headers

  if (authorization !== token) {
    res.status(200)
    return
  }

  next()
}
