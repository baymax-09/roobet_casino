import { type Request } from 'express'
import { type IncomingHttpHeaders } from 'http'

import { type User } from 'src/modules/user/types'
import {
  getCountryCodeFromRequest,
  getIpFromRequest,
  isRequestingUserAllowed,
} from 'src/modules/fraud/geofencing'

type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | JSONValue[]

export interface Context {
  user?: User
  body: JSONValue
  cookies: any
  headers: IncomingHttpHeaders
  countryCode: string | null
  requestingIp: string
  locale: string[] | boolean
  isUserWhitelisted: boolean
  customHeaders: Array<{ name: string; value: string }>
}

export const buildContext = async (req: Request): Promise<Context> => ({
  user: 'user' in req ? (req.user as User) : undefined,
  body: req.body,
  cookies: req.cookies,
  headers: req.headers,
  countryCode: await getCountryCodeFromRequest(req),
  requestingIp: await getIpFromRequest(req),
  locale: req.acceptsLanguages(),
  isUserWhitelisted: isRequestingUserAllowed(req),
  customHeaders: [],
})
