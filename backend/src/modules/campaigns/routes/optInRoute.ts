import express from 'express'
import { type RoobetReq, api } from 'src/util/api'
import {
  makeUniboRequest,
  createUniboRequestId,
  uniboRequestQueryHandler,
  uniboAuthMiddleware,
  uniboRedirectMiddleware,
  type UniboRequestParams,
} from 'src/vendors/unibo'

import { getFrontendBase } from 'src/modules/auth/lib/oauth'

export const createUniboOptInRouter = () => {
  const router = express.Router()

  router.get(
    '/opt-in',
    uniboAuthMiddleware,
    uniboRedirectMiddleware,
    api.validatedApiCall(async (req, res) => {
      const { user } = req as RoobetReq
      const { campaign_id, redirect_url } = uniboRequestQueryHandler(req)

      // If !campaignId or !redirect_url, redirect to homepage
      if (!campaign_id || !redirect_url) {
        res.redirect(getFrontendBase(req))
        return
      }

      const requestId = createUniboRequestId(campaign_id, user.id)

      const optInRequest: UniboRequestParams = {
        action: 'optInPlayer',
        data: {
          campaign_id,
          player_id: user.id,
          request_id: requestId,
        },
      }

      await makeUniboRequest(optInRequest)
      res.redirect(redirect_url)
    }),
  )

  return router
}
