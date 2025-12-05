import { Router } from 'express'

import { api } from 'src/util/api'

import {
  getYggdrasilEvent,
  getYggdrasilValidator,
  validateRequest,
  yggdrasilErrorMiddleware,
  yggdrasilLogger,
} from '../lib'

const asyncCallback = api.scopedAsyncCallback(yggdrasilLogger)

export function createCallbackRouter() {
  const router = Router()

  router.post(
    /.*/,
    validateRequest,
    asyncCallback(async (req, res, next, logger) => {
      try {
        const validator = getYggdrasilValidator(req)
        const event = getYggdrasilEvent(req, validator)
        const response = await event.handler(event.data)

        logger.debug('Yggdrasil Response', { response })
        res.json(response)
      } catch (error) {
        next(error)
      }
    }),
  )

  router.use(yggdrasilErrorMiddleware)

  return router
}
