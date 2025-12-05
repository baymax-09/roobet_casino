import express from 'express'

import { sleep } from 'src/util/helpers/timer'
import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import { acquireLock, deleteLock } from 'src/util/named-lock'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'
import {
  createAffiliateNonceFromRequest,
  verifyAffiliateToken,
} from 'src/modules/auth'

import {
  getAffiliateReport,
  claimAffiliateEarnings,
  getReferredBy,
  getAffiliateUserStats,
} from '../lib'
import { APIValidationError } from 'src/util/errors'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/affiliate', router)

  router.get(
    '/claim',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      await sleep(2000 * Math.random())
      const { user } = req as RoobetReq
      await acquireLock([user.id, 'affiliate/claim'], 10000)

      await claimAffiliateEarnings(user.id)

      setTimeout(() => {
        deleteLock([user.id, 'affiliate/claim'])
      }, 5000)
    }),
  )

  router.get(
    '/get',
    api.check,
    api.validatedApiCall(async req => {
      if (typeof req.query.daysAgo !== 'string') {
        return false
      }
      const daysAgo = parseInt(req.query.daysAgo)
      const { user } = req as RoobetReq

      return await getAffiliateReport(user.id, daysAgo)
    }),
  )

  router.get(
    '/referredBy',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      return await getReferredBy(user)
    }),
  )

  /**
   * THIRD PARTY/PUBLIC
   */
  interface AffiliateReq {
    userId?: string
    startDate?: string
    endDate?: string
    limit?: number
    gameIdentifier?: string
    excludedGames?: string
  }

  router.get(
    '/stats',
    api.validatedApiCall(async req => {
      const authHeader = req.headers.authorization
      const {
        userId,
        startDate,
        endDate,
        limit,
        gameIdentifier,
        excludedGames,
      } = req.query as AffiliateReq

      const { success, error } = await verifyAffiliateToken(userId, authHeader)
      if (!success) {
        throw new APIValidationError(error ?? 'An error has occurred')
      }

      const stats = await getAffiliateUserStats({
        affiliateId: userId,
        startDate,
        endDate,
        limit,
        gameIdentifier,
        excludedGames,
      })
      return stats
    }),
  )

  router.get(
    '/token',
    api.check,
    api.validatedApiCall(async (req, res) => {
      const { userId } = req.query as AffiliateReq
      const { token, success, error } =
        await createAffiliateNonceFromRequest(userId)
      if (!success) {
        res.status(400).send(error ?? 'An error has occurred')
        return
      }
      res.status(200).send(token)
    }),
  )
}
