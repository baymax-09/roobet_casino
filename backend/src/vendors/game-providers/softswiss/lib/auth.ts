import { type RequestHandler } from 'express'

import * as softswissAPI from './api'

export const signatureCheck: RequestHandler = (req, res, next) => {
  const sigHeader = req.headers['x-request-sign']
  const sigShouldBe = softswissAPI.signHMAC(req.rawBody.toString())
  if (sigHeader !== sigShouldBe) {
    res.status(403).json({ code: 403, message: 'Signature invalid.' })
    return
  }
  next()
}
