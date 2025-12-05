import { Router } from 'express'

import { api } from 'src/util/api'

import {
  validateRequest,
  handleHacksawEvent,
  hacksawErrorMiddleware,
} from '../lib'
import { hacksawLogger } from '../lib/logger'

const asyncCallback = api.scopedAsyncCallback(hacksawLogger)

export function createCallbackRouter() {
  const router = Router()

  router.post(
    '/',
    validateRequest,
    asyncCallback(async (req, res, next, logger) => {
      try {
        const { action } = req.body

        const response = await handleHacksawEvent(action, req.body)
        logger.info('response', { response })
        res.json(response)
      } catch (error) {
        next(error)
      }
    }),
  )

  router.use(hacksawErrorMiddleware)

  return router
}
