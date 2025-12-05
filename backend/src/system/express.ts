import useragent from 'express-useragent'
import compression from 'compression'
import http from 'http'
import express, { type Request } from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'

import {
  fingerprintMiddleware,
  originsMiddleware,
  hostMiddleware,
  sessionMiddleware,
  tracerMiddleware,
} from 'src/util/middleware'
import { ipMiddleware } from 'src/modules/fraud/geofencing'
import { getPassport } from 'src/modules/auth'
import { localeMiddleware } from 'src/util/middleware/locale'

import i18n from './i18n'
import { config } from './config'
import { metricsMiddleware } from './metrics'

export const app = express()
export const server = http.createServer(app)

export const metricsApp = express()
export const metricsServer = http.createServer(metricsApp)

export const passport = getPassport()

export async function loadExpressMiddleware(): Promise<void> {
  ;[
    metricsMiddleware,
    hostMiddleware,
    // To expose Graphiql in staging/local
    helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' }),
    useragent.express(),
    i18n.init,
    compression(),
    cookieParser(),
    express.json({
      limit: '10mb',
      // Keep a copy of the raw body.
      verify: (req, _, buf) => {
        ;(req as Request).rawBody = buf
      },
    }),
    express.urlencoded({ limit: '50mb', extended: true }),
    originsMiddleware,
    sessionMiddleware,
    passport.initialize(),
    passport.session(),
    ipMiddleware,
    fingerprintMiddleware,
    localeMiddleware,
    tracerMiddleware,
  ].forEach(middleware => app.use(middleware))

  metricsApp.use(tracerMiddleware)

  // run after helmet?
  if (config.isProd || config.isStaging) {
    app.set('trust proxy', 1) // trust first proxy
  }
}
