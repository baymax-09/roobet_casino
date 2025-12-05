import crypto from 'crypto'
import { type Request, type Response } from 'express'

import { config, getBackendDomainFromReq } from 'src/system'
import { type Types as UserTypes } from 'src/modules/user'
import { Mutex } from 'src/util/redisModels'
import * as Kyc from 'src/modules/fraud/kyc'
import { publishUserLoginMessageToFastTrack } from 'src/vendors/fasttrack'
import { sendTwoFactorCode } from 'src/vendors/mailgun'
import { getIpFromRequest } from 'src/modules/fraud/geofencing'

import { generateUserToken, generateTotpCodeForUser } from 'src/modules/auth'
import { setAuthCookies } from '../lib/index'
import { authLogger } from './logger'

interface LoginResponse {
  twofactorRequired?: boolean
  email?: boolean
}

/**
 * Helper to authenticate a specified user on the current request.
 *
 * In order for the cookie to be valid on all subdomains of the host,
 * we mutate the domain on the session cookie. Changing any value on
 * req.session.cookie will force express to return an updated Set-Cookie
 * header in the response.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
 */
export const loginUser = (req: Request, user: UserTypes.User) => {
  return new Promise<void>((resolve, reject) => {
    req.login(user, err => {
      if (err) {
        reject(err)
        return
      }

      req.session.cookie.domain = getBackendDomainFromReq(req)
      resolve()
    })
  })
}

/** @todo PD Implement checkForAutolock, countryIsBannedMiddleware middlewares on this function instead of route */
export const doLogin = async ({
  req,
  res,
  user,
  twofactorToken,
}: {
  req: Request
  res: Response
  user: UserTypes.User
  twofactorToken?: string
}): Promise<LoginResponse> => {
  // Publish message to RabbitMQ that user has logged in
  publishUserLoginMessageToFastTrack({
    userId: user.id,
    user_agent: req.useragent?.source,
    ip_address: await getIpFromRequest(req),
  })
  /*
   * 3 diff things..
   * 1. user has twofactorEnabled.
   * 2. user has emailVerified
   * 3. user has nothing
   */
  const ip = await getIpFromRequest(req, '2')
  let machineRecognized = false
  const login_secret = config.login_secret
  const login_hash = crypto
    .createHmac('sha256', login_secret)
    .update(user.id)
    .digest('hex')
    .slice(0, 10)

  const machineSecret = req.cookies.machineSecret

  const login = async () => {
    if (!user.kycLevel) {
      try {
        // If user is corrupted and doesn't have a KYC level then we
        // reevaluate based on existing user docs & kyc doc in mongo.
        await Kyc.revalidateKycForUser(user.id)
      } catch {}
    }

    await loginUser(req, user)
  }

  if (machineSecret === login_hash) {
    machineRecognized = true
  }

  // 777Lucky is a test account shared with third-parties for testing
  // on production. Bypass the checkpoint for this account.
  if (user.name === '777Lucky') {
    machineRecognized = true
  }

  // If TFA code was supplied, validate it and then login.
  if (twofactorToken) {
    await generateUserToken(user, twofactorToken, true)
    setAuthCookies(req, res, user)

    await login()
    return {}
  }

  // If a user's machine is not recognized, and they do not have TFA enabled,
  // send a code via email for verification.
  if (
    config.mode !== 'dev' &&
    !machineRecognized &&
    user.email &&
    user.emailVerified &&
    !user.twofactorEnabled
  ) {
    const twoCode = await generateTotpCodeForUser(user)

    req.session.validate2fa = {
      userId: user.id,
    }

    const sentLast5Minutes = await Mutex.checkMutex('email-checkpoint', user.id)
    if (!sentLast5Minutes) {
      await sendTwoFactorCode(user, user.email, twoCode, user.name)
      Mutex.setMutex('email-checkpoint', user.id, 60 * 1)
      authLogger('login/doLogin', { userId: user.id }).info(
        'Sent email checkpoint for user: ',
        { name: user.name, id: user.id, ip },
      )
    }

    return { twofactorRequired: true, email: true }
  }

  // If no TFA code, either login or return response requesting user-supplied code.
  if (req.session.validate2fa) {
    delete req.session.validate2fa
  }

  await generateUserToken(user)
  setAuthCookies(req, res, user)

  if (user.twofactorEnabled) {
    req.session.validate2fa = {
      userId: user.id,
    }
  } else {
    await login()
  }

  return { twofactorRequired: user.twofactorEnabled }
}
