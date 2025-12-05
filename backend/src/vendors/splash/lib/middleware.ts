import { config } from 'src/system'

import { type RequestHandler } from 'express'

export const validateSplashAuthorization: RequestHandler = (req, res, next) => {
  const { authorization } = req.headers

  const [, token] = (authorization ?? '').match(/^Bearer ([A-z0-9-_]+)$/) ?? []

  if (!token || token !== config.splashTech.privateKey) {
    res.status(403).send({
      error: 'Unauthorized',
    })
    return
  }

  next()
}
