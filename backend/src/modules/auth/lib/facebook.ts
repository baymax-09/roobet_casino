import {
  Strategy as FacebookStrategy,
  type Profile,
  type StrategyOptionWithRequest,
} from 'passport-facebook'
import { type Request, type Response, type NextFunction } from 'express'

import { config, getBackendUrlFromReq } from 'src/system'
import { type RouterPassport } from 'src/util/api'
import { type Types as UserTypes } from 'src/modules/user'

import {
  findOrCreateUserOauth,
  failureRedirect,
  getFrontendBase,
  getStateToken,
} from './oauth'

import { authLogger } from './logger'

const facebookConfig = config.facebook

type DoneFunction = (
  error: any,
  user?: UserTypes.User | false,
  info?: any,
) => void

async function verifyFunction(
  req: Request,
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  done: DoneFunction,
) {
  const photoUrl =
    profile.photos && profile.photos[0] ? profile.photos[0].value : ''
  const extraAuthInfo = { accessToken, name: profile.displayName, photoUrl }
  const ipCountry = req.headers['cf-ipcountry'] as string | undefined

  try {
    const user = await findOrCreateUserOauth(
      req,
      'facebook',
      profile.id,
      profile.displayName,
      profile?.emails?.[0]?.value ?? '', // Email is not guaranteed from profile
      ipCountry ?? 'N/A',
      extraAuthInfo,
    )
    done(null, user)
  } catch (error) {
    authLogger('facebook/verifyFunction', { userId: profile.id }).error(
      'Facebook OAuth',
      {
        id: profile.id,
        name: profile.displayName,
        email: profile?.emails?.[0]?.value ?? '', // Email is not guaranteed from profile
        ipCountry: ipCountry ?? 'N/A',
        accessToken,
      },
      error,
    )
    done(error.message, false)
  }
}

export function getFacebookStrategy() {
  const passportConfig: StrategyOptionWithRequest = {
    clientID: facebookConfig.clientId,
    clientSecret: facebookConfig.clientSecret,
    callbackURL: getBackendUrlFromReq() + '/auth/oauth/facebook/callback',
    enableProof: true,
    profileFields: ['id', 'displayName', 'photos', 'email'],
    passReqToCallback: true,
  }
  return new FacebookStrategy(passportConfig, verifyFunction)
}

export async function facebookAuthRoute(
  req: Request,
  res: Response,
  next: NextFunction,
  passport: RouterPassport,
) {
  passport.authenticate('facebook', {
    scope: ['email'],
    state: getStateToken(req),
  })(req, res, next)
}

export async function facebookCallbackRoute(
  req: Request,
  res: Response,
  next: NextFunction,
  passport: RouterPassport,
) {
  passport.authenticate(
    'facebook',
    {
      failureRedirect: getFrontendBase(req),
      session: false,
    },
    async (err, user) => {
      if (user) {
        req.user = user
      }
      if (err) {
        await failureRedirect(req, res, [err], 'facebook')
      } else {
        next()
      }
    },
  )(req, res, next)
}
