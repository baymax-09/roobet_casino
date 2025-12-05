import { type RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { decodeToken } from 'src/modules/auth'
import { type Types as UserTypes } from 'src/modules/user'
import { config } from 'src/system'
import {
  YGGDRASIL_PROVIDER_NAME,
  YGGDRASIL_SESSION_KEY_ALGORITHM,
  YGGDRASIL_SESSION_KEY_EXPIRATION,
  YggdrasilDisabledError,
  YggdrasilError,
  YggdrasilInvalidOrgError,
  YggdrasilInvalidSessionTokenError,
} from '../types'

/**
 * The paths that include session tokens.
 */
const authPaths: RegExp = /.+(playerinfo|getbalance|wager).json.*/i

/**
 * The path that includes the initial token, without a playerId in the params.
 */
const initPath: RegExp = /.+playerinfo.json.*/i

/**
 * Validates a request to ensure it has the correct secret.
 */
export const validateRequest: RequestHandler = async (req, res, next) => {
  const logScope = 'validateRequest'

  // If we're disabled, we don't need to validate anything.
  if (config.yggdrasil.enabled !== true) {
    YggdrasilError.logAndRespond(new YggdrasilDisabledError(logScope), res)
    return
  }

  // Determine if this is the initial request, another authenticated request, and if there's a valid token or not.
  const isInit = initPath.test(req.url)
  const needsAuth = authPaths.test(req.url)
  const token = req.query.sessiontoken
  if (typeof token !== 'string') {
    YggdrasilError.logAndRespond(
      new YggdrasilInvalidSessionTokenError(`${token}`, logScope),
      res,
    )
    return
  }

  // If we need to authenticate, check if the token is valid.
  if (needsAuth) {
    try {
      const user = await getUserFromAuthToken(token)
      if (!isInit && req.query.playerid !== user?.id) {
        YggdrasilError.logAndRespond(
          new YggdrasilInvalidSessionTokenError(token, logScope),
          res,
        )
        return
      }
    } catch (err) {
      YggdrasilError.logAndRespond(
        new YggdrasilInvalidSessionTokenError(token, logScope),
        res,
      )
      return
    }
  }

  // Make sure the org matches the expectation.
  const org = req.query.org
  if (typeof org !== 'string') {
    YggdrasilError.logAndRespond(
      new YggdrasilInvalidOrgError(`${org}`, logScope),
      res,
    )
    return
  }
  if (org !== config.yggdrasil.launchOrg) {
    YggdrasilError.logAndRespond(
      new YggdrasilInvalidOrgError(org, logScope),
      res,
    )
    return
  }

  // All good, let it thru!
  next()
}

/**
 * Generates an authentication token for a {@link UserTypes.User user}.
 * @param user The {@link UserTypes.User user} to generate the token for.
 * @returns The generated token.
 */
export function createAuthToken(user: UserTypes.User): string {
  const token = jwt.sign(
    { id: user.id, service: YGGDRASIL_PROVIDER_NAME },
    config.jwt.secret,
    {
      algorithm: YGGDRASIL_SESSION_KEY_ALGORITHM,
      expiresIn: YGGDRASIL_SESSION_KEY_EXPIRATION,
    },
  )
  return token
}

/**
 * Get's the {@link UserTypes.User user} from a {@link token}.
 * @param token The token to get the user from.
 * @returns The {@link UserTypes.User user} or `null`.
 */
export async function getUserFromAuthToken(
  token: string,
): Promise<UserTypes.User | null> {
  const { user } = await decodeToken(token, YGGDRASIL_PROVIDER_NAME)
  return user
}
