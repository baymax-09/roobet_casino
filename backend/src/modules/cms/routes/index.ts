import express from 'express'

import { api, type RouterApp } from 'src/util/api'
import * as RateLimiter from 'src/util/rateLimiter'

import { getUserCMSContent, download } from '../lib/ops'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/cms', router)

  /*
   * This endpoint is fully exposed, as the content
   * needs to be served to even unauthenticated users.
   * Permissions can be applied to individual/groups of
   * documents as needed in the future.
   */
  router.get('/:name/:lang', api.validatedApiCall(getUserCMSContent))

  router.get(
    '/download/:name/:lang',
    RateLimiter.ipThrottleMiddleware('/cms/download', 5, 1),
    api.validatedApiCall(async (req, res) => {
      await download(req, res)
    }),
  )
}
