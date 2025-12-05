import { type RequestHandler, type CookieOptions } from 'express'
import * as t from 'io-ts'
import { type SessionData } from 'express-session'
import session from 'express-session'

import { config } from 'src/system/config'
import { sessionStore } from 'src/util/store'
import { getIpFromRequest } from 'src/modules/fraud/geofencing'

const FingerprintV = t.type({
  ip: t.string,
  country: t.string,
  device: t.string,
})

export const sessionCookieOptions = {
  sameSite: 'lax',
  secure: false,
  httpOnly: true,
  maxAge: 86400000 * 30, // Set max age/ttl to 30 days
} satisfies CookieOptions

type WithFingerprint = t.TypeOf<typeof FingerprintV>

/** @todo extend express.SessionData in declarations */
export interface RoobetSessionData extends SessionData {
  fingerprint?: WithFingerprint
  passport?: {
    user: string
  }
}

export const fingerprintMiddleware: RequestHandler = (req, _, next) => {
  // @ts-expect-error TODO we want this
  if (req.session.passport) {
    const ua = req.useragent

    getIpFromRequest(req, 'localhost').then(ip => {
      // @ts-expect-error TODO: type this if you dare so that session supports fingerprint
      req.session.fingerprint = {
        ip,
        country: (req.headers['cf-ipcountry'] as string) || 'CA',
        // from useragent
        device: `${ua ? ua.browser : ''} on ${ua ? ua.os : ''}`,
      }
      next()
    })
    return
  }
  next()
}

export const sessionMiddleware: RequestHandler = session({
  ...config.session,
  store: sessionStore,
  cookie: sessionCookieOptions,
})
