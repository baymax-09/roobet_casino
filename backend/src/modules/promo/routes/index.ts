import express from 'express'

import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { verifyRecaptchaSignup } from 'src/vendors/recaptcha3'
import { addAffiliate } from 'src/modules/affiliate/lib'
import { acquireLock, deleteLock } from 'src/util/named-lock'

import { redeemPromoCode } from 'src/modules/promo/documents/promo_code'
import { abortMatchPromoWithPenalty } from '../documents/match_promo'
import promoAdminRouter from './admin'
import {
  getIpFromRequest,
  countryIsBannedMiddleware,
} from 'src/modules/fraud/geofencing'
import { promoLogger } from '../lib/logger'

export default function (app: RouterApp) {
  const router = express.Router()
  router.use('/admin', promoAdminRouter())

  app.use('/promo', router)

  router.post(
    '/abortMatchPromoWithPenalty',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      await abortMatchPromoWithPenalty(user.id)
    }),
  )

  router.post(
    '/redeemCode',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      try {
        const { code, recaptcha } = req.body
        const { user } = req as RoobetReq

        if (user.isPromoBanned) {
          throw new APIValidationError('promo__not_qualified')
        }

        await acquireLock([user.id, 'redeemCode'], 600000)
        const recaptchaResult = await verifyRecaptchaSignup(recaptcha)
        if (!recaptchaResult) {
          throw new APIValidationError('auth__bad_recaptcha')
        }

        const affiliateResult = await addAffiliate(user.id, code)

        promoLogger('/redeemCode', { userId: user.id }).info(
          `affiliateResult ${affiliateResult}`,
          { affiliateResult },
        )
        if (affiliateResult.success) {
          await deleteLock([user.id, 'redeemCode'])
          return { referral: true }
        }

        const ip = await getIpFromRequest(req, 'unknown')
        const response = await redeemPromoCode(user, code, ip)
        await deleteLock([user.id, 'redeemCode'])
        return response
      } catch (err) {
        setTimeout(() => {
          const { user } = req as RoobetReq
          deleteLock([user.id, 'redeemCode'])
        }, 1000)
        // TODO remove wrapping try-catch when lock is addressed
        throw err
      }
    }),
  )
}
