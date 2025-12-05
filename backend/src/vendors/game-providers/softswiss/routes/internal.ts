import type express from 'express'

import { config, getFrontendUrlFromReq } from 'src/system'
import { api, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { isDisabled } from 'src/modules/tp-games/documents/blocks'
import { getGame } from 'src/modules/tp-games/documents/games'
import {
  isCountryBanned,
  getIpFromRequest,
  getCountryCodeFromRequest,
} from 'src/modules/fraud/geofencing'

import * as softswissAPI from '../lib/api'
import {
  SOFTSWISS_PRODUCER_SUPPORTED_CURRENCIES,
  getDisplayCurrencyFromRequest,
} from '../lib/currencies'
import { softswissLogger } from '../lib/logger'

/** This is a purely arbitrary IP address to use as a fallback, do not change. */
const FALLBACK_IP = '47.51.71.235'

export default function (router: express.Router) {
  router.get(
    '/getGameLink',
    api.check,
    api.validatedApiCall(async req => {
      const { gameName, type } = req.query
      const { user } = req as RoobetReq

      if (typeof gameName !== 'string') {
        throw new APIValidationError('api__invalid_param', ['gameName'])
      }
      if (!softswissAPI.isValidClientType(type)) {
        throw new APIValidationError('api__invalid_param', ['type'])
      }

      const displayCurrency = getDisplayCurrencyFromRequest(req.query)
      if (!displayCurrency) {
        throw new APIValidationError('api__invalid_param', ['currency'])
      }

      const ip = await getIpFromRequest(req, FALLBACK_IP)

      const game = await getGame({ identifier: gameName })
      if (!game) {
        throw new APIValidationError('game__does_not_exist')
      }

      // Softswiss calls producers, what we call providers
      const producerCurrencies =
        SOFTSWISS_PRODUCER_SUPPORTED_CURRENCIES[game.providerInternal]

      const disabled = await isDisabled(game, user)
      if (disabled) {
        throw new APIValidationError('game__disabled')
      }
      if (await isCountryBanned(req, game?.blacklist)) {
        throw new APIValidationError('game__not__available')
      }
      const countryCode =
        (await getCountryCodeFromRequest(req)) || config.overrideCountryCode
      const currencySupported =
        producerCurrencies?.includes(displayCurrency) ?? false

      const returnUrl = getFrontendUrlFromReq(req)

      let gameLink
      try {
        gameLink = await softswissAPI.startSession({
          user,
          gameName,
          ip,
          type,
          countryCode,
          returnUrl,
          currency: currencySupported ? displayCurrency : 'usd',
        })
      } catch (error) {
        if (error && error.error && error.error.code == 153) {
          throw new APIValidationError(
            'This game is unavailable in your country.',
          )
        } else {
          softswissLogger('/getGameLink', { userId: user.id }).error(
            'error',
            { gameName },
            error,
          )
          throw new APIValidationError(
            'Temporarily unavailable, please try again soon or contact support.',
          )
        }
      }

      return {
        ...gameLink,
        ...(!currencySupported && { supportedCurrencies: producerCurrencies }),
      }
    }),
  )

  router.get(
    '/demo',
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { gameName, type } = req.query

      if (typeof gameName !== 'string') {
        throw new APIValidationError('api__invalid_param', ['gameName'])
      }
      if (!softswissAPI.isValidClientType(type)) {
        throw new APIValidationError('api__invalid_param', ['type'])
      }

      const ip = await getIpFromRequest(req, FALLBACK_IP)
      const locale = user?.locale || 'en'
      let gameLink
      try {
        gameLink = await softswissAPI.demo(gameName, ip, type, locale)
      } catch (error) {
        if (error && error.error && error.error.code == 153) {
          throw new APIValidationError(
            'This game is unavailable in your country.',
          )
        } else {
          softswissLogger('/demo', { userId: user?.id ?? null }).error(
            'error',
            { gameName },
            error,
          )
          throw new APIValidationError(
            'Temporarily unavailable, please try again soon or contact support.',
          )
        }
      }
      const game = await getGame({ identifier: gameName })

      if (await isCountryBanned(req, game?.blacklist)) {
        throw new APIValidationError('game__not__available')
      }

      return { ...gameLink }
    }),
  )

  router.get(
    '/getGameInfo',
    api.validatedApiCall(async req => {
      const { gameName } = req.query
      return await getGame({ identifier: gameName })
    }),
  )
}
