import { type NextFunction, type Request, type Response } from 'express'
import {
  failureRedirect,
  findOrCreateUserOauth,
  getFrontendBase,
  getStateToken,
} from './oauth'

import { Strategy as SteamStrategy } from 'passport-steam'
import { type RouterPassport } from 'src/util/api'
import { config } from 'src/system'
import { type Types as UserTypes } from 'src/modules/user'
import { type Profile } from 'passport'

import { authLogger } from './logger'

type DoneFunction = (
  error: any,
  user?: UserTypes.User | false,
  info?: any,
) => void

const verifyFunction = async (
  req: Request,
  identifier: string,
  profile: Profile,
  done: DoneFunction,
) => {
  const requestState = req.session?.openIdState
  if (!requestState) {
    done('Invalid state', false)
    return
  }
  const cfHeader = req.headers['cf-ipcountry']
  const ipCountry = typeof cfHeader === 'string' ? cfHeader : 'N/A'
  try {
    // TODO: this is not a user
    const user = await findOrCreateUserOauth(
      req,
      'steam',
      identifier,
      profile?.displayName ?? '',
      profile?.emails?.[0]?.value ?? '',
      ipCountry,
      { identifier },
    )
    done(null, user)
  } catch (error) {
    authLogger('steam/verifyFunction', { userId: null }).error(
      'Error finding or creating user',
      {
        ipCountry,
        identifier,
        username: profile?.displayName ?? '',
        email: profile?.emails?.[0]?.value ?? '',
      },
      error,
    )
    done(error.message, undefined)
  }
}

export const getSteamStrategy = () => {
  const passportConfig = {
    returnURL: config.appSettings.backendBase + '/auth/oauth/steam/callback',
    realm: config.appSettings.backendBase,
    apiKey: '',
    profile: false,
    passReqToCallback: true,
  }
  return new SteamStrategy(passportConfig, verifyFunction)
}

export const steamAuthRoute = (
  req: Request,
  res: Response,
  next: NextFunction,
  passport: RouterPassport,
) => {
  req.session.openIdState = getStateToken(req)
  passport.authenticate('steam')(req, res, next)
}

export const steamCallbackRoute = (
  req: Request,
  res: Response,
  next: NextFunction,
  passport: RouterPassport,
) => {
  passport.authenticate(
    'steam',
    {
      failureRedirect: getFrontendBase(req) + '?excludeReferrer=true',
    },
    async (err, user) => {
      if (user) {
        req.user = user
      }
      if (err) {
        await failureRedirect(req, res, [err], 'steam')
      } else {
        next()
      }
    },
  )(req, res, next)
}
