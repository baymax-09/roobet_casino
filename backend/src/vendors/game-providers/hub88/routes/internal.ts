import express from 'express'

import { getFrontendUrlFromReq } from 'src/system'
import { api, type Router, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'

import { getGameUrl } from '../lib/api'
import {
  getDisplayCurrencyFromRequest,
  hub88DemoCurrency,
} from '../lib/currencies'
import { isDemoMode } from '../lib/utils'

export default function (app: Router) {
  const router = express.Router()
  app.use('/internal', router)

  router.get(
    '/getGameUrl',
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { requestingIp } = req.context ?? {}
      const { platform, gameIdentifier, currency } = req.query
      const demo = isDemoMode(currency)
      const displayCurrency = demo
        ? hub88DemoCurrency
        : getDisplayCurrencyFromRequest(req.query)

      // Required; Need at least one
      if (gameIdentifier === 'undefined') {
        throw new APIValidationError(
          'This game is currently unavailable. Please contact support if the problem persists.',
        )
      }

      if (typeof gameIdentifier !== 'string') {
        throw new APIValidationError(
          'This game is currently unavailable. Please contact support if the problem persists.',
        )
      }

      // Optional
      if (platform && typeof platform !== 'string') {
        throw new APIValidationError(
          'This game is currently unavailable. Please contact support if the problem persists.',
        )
      }

      // Optional
      if (requestingIp && typeof requestingIp !== 'string') {
        throw new APIValidationError(
          'This game is currently unavailable. Please contact support if the problem persists.',
        )
      }

      if (!displayCurrency) {
        throw new APIValidationError(
          'This game is currently unavailable. Please contact support if the problem persists.',
        )
      }

      const returnUrl = getFrontendUrlFromReq(req)

      const { url, error, supportedCurrencies } = await getGameUrl({
        user,
        gameIdentifier,
        platform,
        requestingIp,
        currency: displayCurrency,
        returnUrl,
      })

      if (error) {
        throw new Error()
      }

      return {
        url,
        ...(!!supportedCurrencies && { supportedCurrencies }),
      }
    }),
  )
}
