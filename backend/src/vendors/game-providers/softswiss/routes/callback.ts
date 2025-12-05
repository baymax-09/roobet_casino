import type express from 'express'

import { api } from 'src/util/api'

import { signatureCheck } from '../lib/auth'
import * as Transactions from '../lib/transactions'
import { softswissLogger } from '../lib/logger'

const asyncCallback = api.scopedAsyncCallback(softswissLogger)

export default function (router: express.Router) {
  router.post(
    '/play',
    signatureCheck,
    asyncCallback(async (req, res, _, logger) => {
      const { body, code, status } = await Transactions.play(req.body)

      logger.info('response', {
        body: req.body,
        response: {
          body,
          code,
          status,
        },
      })
      res.status(status).json({ ...body, code })
    }),
  )

  router.post(
    '/rollback',
    signatureCheck,
    asyncCallback(async (req, res, _, logger) => {
      const { body, code, status } = await Transactions.rollback(req.body)
      logger.info('response', {
        body: req.body,
        response: {
          body,
          code,
          status,
        },
      })
      res.status(status).json({ ...body, code })
    }),
  )

  router.post(
    '/freespins',
    signatureCheck,
    asyncCallback(async (req, res, _, logger) => {
      const { body = {}, code, status } = await Transactions.freespins(req.body)
      logger.info('response', {
        body: req.body,
        response: {
          body,
          code,
          status,
        },
      })
      res.status(status).json({ ...body, code })
    }),
  )
}
