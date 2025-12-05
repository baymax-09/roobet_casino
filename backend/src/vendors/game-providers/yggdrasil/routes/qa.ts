import { Router } from 'express'

import { api, type RoobetReq } from 'src/util/api'

import {
  createAuthToken,
  yggdrasilErrorMiddleware,
  yggdrasilLogger,
} from '../lib'

const asyncCallback = api.scopedAsyncCallback(yggdrasilLogger)

export function createCallbackRouterForQA() {
  const router = Router()

  router.get(
    '/token',
    api.check,
    asyncCallback(async (req, res, next, logger) => {
      try {
        const {
          user,
          user: { id, name },
        } = req as RoobetReq
        logger.debug('Creating Yggdrasil token for user', {
          user: { id, name },
        })
        const token = createAuthToken(user)
        res.json({ token })
      } catch (error) {
        next(error)
      }
    }),
  )

  router.use(yggdrasilErrorMiddleware)

  return router
}
