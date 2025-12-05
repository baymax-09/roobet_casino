import express, { type RequestHandler } from 'express'
import moment from 'moment'
import tracer from 'dd-trace'

import { BasicCache } from 'src/util/redisModels'
import { determineUserFeatureAccess } from 'src/util/features'
import { routeCache } from 'src/util/helpers/routeCache'
import * as KYC from 'src/modules/fraud/kyc'
import { formatSessionId } from 'src/modules/fraud/riskAssessment'
import {
  getCountryCodeFromRequest,
  getIpFromRequest,
} from 'src/modules/fraud/geofencing'
import { isCountryBanned } from 'src/modules/fraud/geofencing/lib/helpers'
import { getRegionCode } from 'src/vendors/ip2location'
import { determineUserGrantedFeatures } from 'src/modules/userSettings'
import { type BalanceType, BalanceTypes } from 'src/modules/user/types'
import { api } from 'src/util/api'

import {
  getDynamicSettings,
  stripSettingsTable,
  isGlobalSystemEnabled,
} from '../documents/settings'

const settingsRequestHandler: RequestHandler = api.validatedApiCall(
  async (req, res) => {
    const span = tracer.startSpan('decodeCachedSettings', {
      childOf: tracer.scope().active() ?? undefined,
    })
    const settings = stripSettingsTable(
      await BasicCache.cached('settings/get', '', 15, getDynamicSettings),
    )
    span.finish()

    const createSettingsResponse = tracer.startSpan('createSettingsResponse', {
      childOf: tracer.scope().active() ?? undefined,
    })

    const [ip, countryCode, restrictedRegion] = await Promise.all([
      getIpFromRequest(req),
      getCountryCodeFromRequest(req),
      isCountryBanned(req),
    ])

    const [regionCode, flags] = await Promise.all([
      getRegionCode(ip, countryCode),
      determineUserFeatureAccess({
        countryCode: countryCode ?? '',
        user: req.user,
      }),
    ])
    const features = req.user
      ? await determineUserGrantedFeatures(
          { countryCode: countryCode || '' },
          req.user,
        )
      : {}

    const response = {
      ...settings,
      countryCode,
      regionCountryCode: regionCode,
      serverTime: moment().toISOString(),
      locale: req.getLocale(),
      ip,
      restrictedCountries: KYC.RestrictedCountries,
      restrictedRegion,
      sessionId: formatSessionId(req.sessionID),
      flags,
      features,
    }
    createSettingsResponse.finish()

    return response
  },
)

export default function () {
  const router = express.Router()

  router.get('/get', settingsRequestHandler)

  router.get(
    '/roobetLive',
    api.asyncCallback(async (_, res) => {
      const live = await isGlobalSystemEnabled('roobetlive')
      res.json({ live })
    }),
  )

  router.get('/balanceTypes', routeCache(), function (req, res) {
    const balanceTypes: BalanceType[] = [...BalanceTypes]

    // TODO balanceType feature flag

    res.json({ balanceTypes })
  })

  return router
}
