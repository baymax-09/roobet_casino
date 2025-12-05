import {
  Strategy as GoogleStrategy,
  type Profile,
  type VerifyCallback,
  type StrategyOptionsWithRequest,
} from 'passport-google-oauth20'
import { type Request, type Response, type NextFunction } from 'express'

import { config, getBackendUrlFromReq } from 'src/system'
import { type RouterPassport } from 'src/util/api'
import { getUserByEmail } from 'src/modules/user'

import { oauthAlreadyLinked } from '../documents/user_password'
import {
  findOrCreateUserOauth,
  failureRedirect,
  confirmLinkMiddleware,
  getFrontendBase,
  getStateToken,
} from './oauth'

import { authLogger } from './logger'

const googleConfig = config.google

async function verifyFunction(
  req: Request,
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  done: VerifyCallback,
) {
  const ipCountry = req.headers['cf-ipcountry'] as string | undefined
  const uniqueId = profile.id
  const email = profile?.emails?.[0]?.value ?? '' // Email is not guaranteed from profile
  try {
    if (!(await oauthAlreadyLinked('google', uniqueId)) && email?.length) {
      // Check if the account email matches an existing user
      const userWithEmail = await getUserByEmail(email)
      if (userWithEmail && !userWithEmail.emailVerified) {
        // Special case for linking unverified email
        const info = {
          linking: {
            uniqueId,
            userId: userWithEmail.id,
            accessToken,
            name: profile.displayName,
          },
        }
        done(null, undefined, info)
        return
      }
    }

    const user = await findOrCreateUserOauth(
      req,
      'google',
      uniqueId,
      profile.displayName,
      email,
      ipCountry ?? 'N/A',
      { accessToken, name: profile.displayName },
    )
    done(null, user)
  } catch (error) {
    authLogger('google/verifyFunction', { userId: profile.id }).error(
      'Google OAuth',
      {
        uniqueId,
        name: profile.displayName,
        email,
        ipCountry: ipCountry ?? 'N/A',
        accessToken,
      },
      error,
    )
    done(error.message, undefined)
  }
}

export function getGoogleStrategy() {
  const passportConfig: StrategyOptionsWithRequest = {
    clientID: googleConfig.clientId,
    clientSecret: googleConfig.clientSecret,
    callbackURL: getBackendUrlFromReq() + '/auth/oauth/google/callback',
    passReqToCallback: true,
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
  }
  return new GoogleStrategy(passportConfig, verifyFunction)
}

export async function googleAuthRoute(
  req: Request,
  res: Response,
  next: NextFunction,
  passport: RouterPassport,
) {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'login',
    state: getStateToken(req),
  })(req, res, next)
}

export async function googleCallbackRoute(
  req: Request,
  res: Response,
  next: NextFunction,
  passport: RouterPassport,
) {
  passport.authenticate(
    'google',
    {
      failureRedirect: getFrontendBase(req) + '?excludeReferrer=true',
      session: false,
    },
    async (err, user, info) => {
      if (user) {
        req.user = user
      }
      if (info && 'linking' in info) {
        confirmLinkMiddleware(req, res, 'google', info.linking)
      } else if (err) {
        await failureRedirect(req, res, [err], 'google')
      } else {
        next()
      }
    },
  )(req, res, next)
}
