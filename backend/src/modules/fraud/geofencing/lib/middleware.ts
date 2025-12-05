import { type RequestHandler } from 'express'

import { scopedLogger } from 'src/system/logger'

import { t } from 'src/util/i18n'

import { addIpToIpTracerFromReq } from '../documents/ip_tracer'
import { getIpFromRequest, isCountryBanned } from './helpers'

const fraudLogger = scopedLogger('fraud')

export const countryIsBannedMiddleware: RequestHandler = (req, res, next) => {
  isCountryBanned(req)
    .then(countryIsBanned => {
      if (countryIsBanned) {
        res.status(400).send({
          code: 'bad__country',
          message: t(req.user, 'bad__country'),
        })
        return
      }

      addIpToIpTracerFromReq(req)

      next()
    })
    .catch(err => {
      fraudLogger('countryIsBannedMiddleware', { userId: null }).error(
        '',
        {},
        err,
      )
    })
}

export const ipMiddleware: RequestHandler = (req, _, next) => {
  getIpFromRequest(req).then(ip => {
    req.context = {
      ...(req.context ?? {}),
      requestingIp: ip,
    }

    next()
  })
}
