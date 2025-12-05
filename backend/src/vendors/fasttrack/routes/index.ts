import express from 'express'

import { api, type RouterApp } from 'src/util/api'
import { getUserById } from 'src/modules/user'

import { callbackRouter } from './callback'
import { publishCustomFastTrackEvent } from '../rabbitmq'
import { fasttrackLogger } from '../lib/logger'

export default function (app: RouterApp) {
  const router = express.Router()

  app.use('/fasttrack', router)

  router.post(
    '/customGTM',
    api.validatedApiCall(async function (req, res) {
      const userId = req.user?.id ?? null
      const logger = fasttrackLogger('/customGTM', { userId })
      const { notificationType, data } = req.body

      if (!userId || typeof userId !== 'string') {
        logger.info('Invalid user id')
        res.json({ success: false })
        return
      }

      const user = await getUserById(userId)
      if (!user) {
        logger.info('Could not find user')
        res.json({ success: false })
        return
      }

      await publishCustomFastTrackEvent({
        notificationType,
        userId,
        request: req,
        data,
      })

      res.json({ success: true })
    }),
  )

  callbackRouter(router)
}
