import express from 'express'

import { type RouterApp, api } from 'src/util/api'

import { handleWebhookUpdate, verifySignature } from '../lib/webhook'
import { seonLogger } from '../lib/logger'

const asyncCallback = api.scopedAsyncCallback(seonLogger)

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/seon', router)

  router.post(
    '/update',
    asyncCallback(async (req, res, _, logger) => {
      const signature =
        typeof req.headers.digest === 'string'
          ? req.headers.digest.split('=')[1]
          : ''

      if (!verifySignature(signature, req.body)) {
        logger.error('Invalid webhook access', { headers: req.headers })
        res.status(401).send('NO')
        return
      }

      await handleWebhookUpdate(req.body)
      res.status(200).send('OK')
    }),
  )
}
