import { type Request, type Response } from 'express'

import { getBackendUrlFromReq, getFrontendUrlFromReq } from 'src/system'
import { addAffiliate } from 'src/modules/affiliate/lib'
import { initUserSignup } from 'src/modules/user'
import {
  getCountryCodeFromRequest,
  getIpFromRequest,
} from 'src/modules/fraud/geofencing'
import {
  publishCustomFastTrackEvent,
  publishUserSignUpMessageToFastTrack,
} from 'src/vendors/fasttrack'
import { getOrCreateUserConsent } from 'src/modules/crm/lib'
import { generateUserToken } from 'src/modules/auth'
import { isAvailableLocale } from 'src/system/i18n'
import { getBestLanguageMatch } from 'src/util/middleware/locale'

import { setAuthCookies } from '../lib/index'
import { loginUser } from './login'
import { authLogger } from './logger'

export interface SignupArgs {
  req: Request
  username: string
  email: string
  password: string
  res?: Response
  birthDate?: string
  affiliateName?: string
  opts?: {
    mustSetName?: boolean
  }
}

export const doSignup = async ({
  req,
  res,
  username,
  email,
  password,
  birthDate,
  affiliateName,
  opts,
}: SignupArgs) => {
  const countryCode = (await getCountryCodeFromRequest(req)) || 'N/A'
  const ip = await getIpFromRequest(req, '1')

  const session = {
    id: req.sessionID,
    data: (req.headers['x-seon-session-payload'] as string) || '',
  }

  const localeHeader = getBestLanguageMatch(req.headers['accept-language'])

  const locale = isAvailableLocale(localeHeader) ? localeHeader : null

  const apiUrl = getBackendUrlFromReq(req)
  const returnUrl = getFrontendUrlFromReq(req)

  const user = await initUserSignup({
    username,
    email,
    password,
    countryCode,
    ip,
    session,
    opts: {
      ...opts,
      locale,
      apiUrl,
      returnUrl,
      dob: birthDate,
    },
  })

  authLogger('doSignup', { userId: user.id }).info(
    `Created account ${user.name} ID: ${user.id} IP: ${ip}`,
    { name: user.name, id: user.id, ip, countryCode },
  )

  if (user) {
    publishFasttrackSignUpMessages(user.id, req)
  }

  if (affiliateName) {
    await addAffiliate(user.id, affiliateName)
  }

  if (res) {
    await generateUserToken(user)
    setAuthCookies(req, res, user)
  }

  await loginUser(req, user)

  return user
}

const publishFasttrackSignUpMessages = async (userId: string, req: Request) => {
  // Publish message to RabbitMQ that user has signed up
  publishUserSignUpMessageToFastTrack({
    userId,
    url_referer: req.get('referer')?.replace(/^https?:\/\//, ''),
    user_agent: req.useragent?.source,
    ip_address: await getIpFromRequest(req),
  })

  // Update FT that user has not yet verified their email
  publishCustomFastTrackEvent({
    notificationType: 'Email_Verified',
    userId,
    request: req,
    data: {
      email_verified: false,
    },
  })

  // Create consents for user
  await getOrCreateUserConsent(userId)
}
