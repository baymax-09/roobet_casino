import crypto from 'crypto'
import request from 'request-promise'

import { config } from 'src/system'
import { type Types as UserTypes } from 'src/modules/user'
import { type DisplayCurrency } from 'src/modules/user/types/DisplayCurrency'

import { getUserBalance, getUserRequestObject } from '../util'
import { displayCurrencyToCurrencyCode } from '../currencies'
import { softswissLogger } from '../logger'

export const CLIENT_TYPES = ['mobile', 'desktop'] as const
export type ClientType = (typeof CLIENT_TYPES)[number]
export const isValidClientType = (type: any): type is ClientType => {
  return (CLIENT_TYPES as readonly string[]).includes(type)
}

const AUTH_TOKEN = config.softswiss.authToken
const CASINO_ID = config.softswiss.casinoId
const RETURN_URL = config.softswiss.returnUrl

function buildUri(endpoint: string): string {
  const apiUrl = config.softswiss.apiUrl
  const uriArray = [apiUrl, endpoint]
  return uriArray.join('/')
}

export const post = async (
  endpoint: string,
  postBody: object | null = null,
  headers: object = {},
) => {
  const options = {
    method: 'POST',
    uri: buildUri(endpoint),
    json: true,
    body: {},
    headers: headers || {
      'content-type': 'application/json',
    },
  }
  if (postBody) {
    options.body = postBody
  }

  return await request(options)
}

export function signHMAC(body: string) {
  return crypto.createHmac('sha256', AUTH_TOKEN).update(body).digest('hex')
}

export function getHeaders(body: any) {
  return {
    'X-REQUEST-SIGN': signHMAC(JSON.stringify(body)),
  }
}

export async function demo(
  gameName: string,
  ip: string,
  type: ClientType,
  locale = 'en',
) {
  const endpoint = 'demo'
  const body = {
    casino_id: CASINO_ID,
    game: gameName,
    locale,
    client_type: type,
    ip,
    urls: {
      deposit_url: RETURN_URL + '?modal=cashier&tab=deposit',
      return_url: RETURN_URL,
    },
  }
  softswissLogger('demo', { userId: null }).info('body', { body })
  return await post(endpoint, body, getHeaders(body))
}

interface StartSessionParams {
  user: UserTypes.User
  gameName: string
  ip: string
  type: ClientType
  countryCode: string
  returnUrl: string
  currency: DisplayCurrency
}

export async function startSession({
  user,
  gameName,
  ip,
  type,
  countryCode,
  returnUrl,
  currency,
}: StartSessionParams) {
  const logger = softswissLogger('startSession', { userId: user.id })
  const endpoint = 'sessions'
  const userId = user.id
  const userBalance = await getUserBalance({ user_id: userId }, currency)

  const body = {
    casino_id: CASINO_ID,
    game: gameName,
    currency: displayCurrencyToCurrencyCode(currency),
    locale: user.locale || 'en',
    ip: countryCode != 'CA' ? ip : '185.153.177.67',
    client_type: type,
    balance: userBalance,
    user: await getUserRequestObject(user, countryCode, currency),
    urls: {
      deposit_url: `${returnUrl}?modal=cashier&tab=deposit`,
      return_url: `${returnUrl}/slots/${gameName}`,
    },
  }
  logger.info('body', { body })
  if (gameName.toLowerCase().includes('blackjack')) {
    body.urls.return_url = `${returnUrl}/blackjack/${gameName}`
  }
  try {
    return await post(endpoint, body, getHeaders(body))
  } catch (error) {
    logger.error('error', {}, error)
  }
}
