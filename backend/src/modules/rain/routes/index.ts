import express from 'express'

import type * as Types from '../types'
import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import { Middleware as adminMidWare } from 'src/modules/admin'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'

import { createRain, joinRain, currentRain } from '../documents/rain'
import { APIValidationError } from 'src/util/errors'
import { verifyRecaptchaSignup } from 'src/vendors/recaptcha3'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/rain', router)

  router.get(
    '/active',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const rain: Partial<Types.Rain & { hasJoined: boolean }> | null =
        await currentRain()
      if (rain) {
        const hasJoined = !!rain.usersEnteredRain?.[user.id]
        delete rain.usersEnteredRain
        delete rain.usersShareOfRain
        rain.hasJoined = hasJoined
      }
      return rain
    }),
  )

  router.post(
    '/create',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { amount, countdown, duration } = req.body
      await createRain(user, amount, countdown, duration)
    }),
  )

  router.post(
    '/admin/create',
    api.check,
    ...adminMidWare.roleCheck([{ resource: 'rains', action: 'create' }]),
    adminMidWare.logAdminAction,
    api.validatedApiCall(async (req, res) => {
      res.status(500).send('Disabled')
      /*
       * const { amount, countdown, duration, balanceTypeOverride } = req.body
       * const newAmount = parseFloat(amount)
       */

      /*
       * if (isNaN(newAmount)) {
       *   return res.status(500).send('Amount is not a number')
       * }
       */

      // await createRain(req.user, amount, countdown, duration, balanceTypeOverride)
    }),
  )

  router.post(
    '/joinRain',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { recaptcha } = req.body
      const { user } = req as RoobetReq

      const recaptchaResult = await verifyRecaptchaSignup(recaptcha)
      if (!recaptchaResult) {
        throw new APIValidationError('auth__bad_recaptcha')
      }

      await joinRain(user)
    }),
  )
}
