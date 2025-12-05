import { type RequestHandler } from 'express'
import { type RoobetReq } from 'src/util/api'
import { t } from 'src/util/i18n'

export const chatModMiddleware: RequestHandler = (req, res, next) => {
  const { user: adminUser } = req as RoobetReq
  if (!adminUser.isChatMod) {
    res.status(403).send(t(adminUser, 'chat__no_mod'))
    return
  }

  next()
}
