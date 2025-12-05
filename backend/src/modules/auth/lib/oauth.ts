import type express from 'express'
import jwt from 'jsonwebtoken'
import { generateUsername } from 'unique-username-generator'

import { verifyRecaptchaSignup } from 'src/vendors/recaptcha3'
import { config, getFrontendUrlFromReq, getBackendUrlFromReq } from 'src/system'
import { translateForUser, translateWithLocale } from 'src/util/i18n'
import { type Types as UserTypes, updateUser } from 'src/modules/user'
import { getUserByEmail, getUserById, userIsLocked } from 'src/modules/user'

import { addAffiliate } from 'src/modules/affiliate/lib'

import {
  getAllPasswordsByProvider,
  getUserPasswordForUser,
  updateUserPassword,
  verifyUserLogin,
} from 'src/modules/auth'

import { setLinkCookies } from './index'
import { oauthAlreadyLinked } from '../documents/user_password'
import { doLogin } from '../lib/login'
import { type SignupArgs, doSignup } from '../lib/signup'
import { APIValidationError } from 'src/util/errors'
import { type User } from 'src/modules/user/types'
import { authLogger } from './logger'

interface StateParams {
  mirrorUri?: string | null
  mirrorAPIUri?: string | null
  userId?: string | null
}
const isStateParams = (value: any): value is StateParams =>
  'mirrorUri' in value && 'mirrorAPIUri' in value

export async function findUserByOauthProvider(
  provider: string,
  uniqueId: string,
) {
  const passwords = await getAllPasswordsByProvider(uniqueId, provider)

  if (passwords.length > 0) {
    for (const pass of passwords) {
      const user = await getUserById(pass.id)
      if (user) {
        return user
      }
    }
  }
}

const getCredsField = (provider: string) => `${provider}-creds`

/**
 * setOauthProviderForUser is also used to remove Oauth providers for users. We
 * can pass in a null value for uniqueId and extraCreds.
 */
export async function setOauthProviderForUser(
  userId: string,
  provider: string,
  uniqueId: string | null,
  extraCreds: Record<any, any> | null,
) {
  await updateUserPassword(userId, {
    [provider]: uniqueId,
    [getCredsField(provider)]: extraCreds,
  })
}

export async function getOauthExtraCredsForUser(
  userId: string,
  provider: string,
) {
  const secretTable = await getUserPasswordForUser(userId)
  // @ts-expect-error bro let me arbitrarily index objects
  return secretTable[getCredsField(provider)]
}

export async function getOauthIdForUser(userId: string, provider: string) {
  const secretTable = await getUserPasswordForUser(userId)
  // @ts-expect-error bro let me arbitrarily index objects
  return secretTable[provider]
}

/** Maximum length constraint of 15 (our max), and 3 random digits with no separators. */
const generateRandomUsername = (): string => {
  return generateUsername('', 3, 15)
}

export async function doUserSignup({
  req,
  email,
}: {
  req: express.Request
  email?: string
}): Promise<User | undefined> {
  // Set email to an empty string if it's already taken
  const userWithEmail = await getUserByEmail(email ?? '')
  email = userWithEmail ? '' : (email ?? '').toLowerCase()

  // Retry with 5 random usernames before exiting.
  let usernameRetries = 5

  while (usernameRetries > 0) {
    usernameRetries--

    // Generate a random, temporary username.
    const username = generateRandomUsername()

    // Create a new user.
    const signupArgs: SignupArgs = {
      req,
      email,
      username,
      password: '',
      affiliateName: req.session.affiliateName,
      opts: { mustSetName: true },
    }

    try {
      return await doSignup(signupArgs)
    } catch (error) {
      authLogger('doUserSignup', { userId: null }).error(
        'doSignup error',
        {
          email,
          username,
          affiliateName: req.session.affiliateName,
        },
        error,
      )

      // If the random username already exists, retry.
      if (
        error instanceof APIValidationError &&
        error.message === 'user__already_exists'
      ) {
        continue
      }

      // Any other errors, break.
      break
    }
  }
}

async function getLinkingUser({
  req,
  provider,
  uniqueId,
}: {
  req: express.Request
  provider: string
  uniqueId: string
}) {
  const requestUser = req.user as UserTypes.User | undefined
  const isLinking = req.session.linking ?? false

  if (isLinking) {
    // If the session is being linked, ensure the state's userId matches the current user id
    if (requestUser) {
      const { userId } = getStateDataFromToken(req)
      if (!userId || !requestUser?.id || requestUser.id !== userId) {
        throw new Error('auth__oauth_user_not_exists')
      }
    }

    // Check if the user is already linked
    if (await oauthAlreadyLinked(provider, uniqueId)) {
      throw new Error('auth__user_already_linked')
    }

    return requestUser
  }
}

async function getExistingUser({
  provider,
  uniqueId,
  email,
}: {
  provider: string
  uniqueId: string
  email?: string
}) {
  let existingUser: UserTypes.User | undefined

  // Check the user passwords collection for this unique id and provider and derive the user from it.
  const oauthUser = await findUserByOauthProvider(provider, uniqueId)
  if (oauthUser) {
    existingUser = oauthUser
  }

  // Special flow if this is a Google account
  if (
    !existingUser &&
    provider === 'google' &&
    !(await oauthAlreadyLinked(provider, uniqueId)) &&
    email?.length
  ) {
    // Check if the account email matches an existing user
    const userWithEmail = await getUserByEmail(email)
    if (userWithEmail && userWithEmail.emailVerified) {
      existingUser = userWithEmail
    }
  }

  return existingUser
}

async function getUserFromSignup({
  req,
  email,
  provider,
}: {
  req: express.Request
  email: string
  provider: string
}) {
  const user = await doUserSignup({ req, email })
  if (!user) {
    throw new Error('auth__signup')
  }
  if (provider === 'google' && email) {
    // Automatically verify the email for the user if not verified
    await updateUser(user.id, { email, emailVerified: true })
  }
  return user
}

/**
 * @todo don't pass req as a parameter, extract relevant values
 */
export async function findOrCreateUserOauth(
  req: express.Request,
  provider: string,
  uniqueId: string,
  username: string,
  email: string,
  countryCode: string,
  extraAuthInfo: Record<any, any>,
) {
  const isSignup = req?.session?.signup ?? false

  // Get the user on the request if it exists and we are linking.
  const linkingUser = await getLinkingUser({ req, provider, uniqueId })

  // Get the user from either the provider + uniqueId or email if we are not linking.
  const existingUser =
    linkingUser ?? (await getExistingUser({ provider, uniqueId, email }))

  // Get the final user either from the existing user or from signup if we are signing up.
  const user =
    existingUser ??
    (isSignup && (await getUserFromSignup({ req, email, provider })))

  // Throw if there is no user somehow.
  if (!user) {
    throw new Error('auth__oauth_user_not_exists')
  }

  // Throw an error if the user is locked
  if (!!user && (await userIsLocked(user))) {
    throw new Error('account__locked')
  }

  // Set the affiliate if it's part of the session
  if (req.session.affiliateName) {
    await addAffiliate(user.id, req.session.affiliateName)
  }

  // Update the user passwords collection with the OAuth data
  await setOauthProviderForUser(user.id, provider, uniqueId, extraAuthInfo)
  return user
}

async function oauthComplete(req: express.Request, res: express.Response) {
  if (req.user) {
    return await doLogin({ user: req.user, req, res })
  }
  return {}
}

export async function oauthCompleteRoute(
  req: express.Request,
  res: express.Response,
) {
  const oauthCompleteParams = new URLSearchParams({ excludeReferrer: 'true' })

  if (req.session.linking) {
    const successKey = 'auth__link_success'
    const authSuccessMessage = req.user
      ? translateForUser(req.user, successKey)
      : translateWithLocale(req.acceptsLanguages(), successKey)
    oauthCompleteParams.set('authSuccesses', `["${authSuccessMessage}"]`)
    oauthCompleteParams.set('modal', 'account')
    oauthCompleteParams.set('tab', 'security')
    setLinkCookies(req, res)
    req.session.linking = false
  }

  const { twofactorRequired, email } = await oauthComplete(req, res)
  if (twofactorRequired && !req.session.linking) {
    oauthCompleteParams.set('modal', 'auth')
    oauthCompleteParams.set('tab', 'twofactorRequired')
  }
  if (email) {
    oauthCompleteParams.set('modal', 'auth')
    oauthCompleteParams.set('tab', 'twofactorEmail')
  }
  if (req.session.curriedRedirect) {
    oauthCompleteParams.set('redirect_url', req.session.curriedRedirect)
    Reflect.deleteProperty(req.session, 'curriedRedirect')
  }
  res.redirect(`${getFrontendBase(req)}?${oauthCompleteParams.toString()}`)
}

export function linkMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  req.session.linking = true
  next()
}

export function signupMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  if (
    typeof req.query.affiliateName === 'string' &&
    req.query.affiliateName !== 'null'
  ) {
    req.session.affiliateName = req.query.affiliateName
  }
  if (typeof req.query.signup === 'string' && req.query.signup !== 'null') {
    req.session.signup = true
  }
  req.session.linking = false
  next()
}

export function redirectMiddleware(
  req: express.Request,
  res: express.Response,
  strategy: string,
) {
  if (req.query) {
    const query = req.query as Record<string, string>
    // This redirect needs to happen to avoid cross origin cookie issues.
    const redirectUri =
      getBackendBase(req) +
      `/auth/oauth/${strategy}/redirectCallback?` +
      new URLSearchParams(query).toString()
    res.redirect(redirectUri)
    return
  }
  // Failure state redirects to the frontend.
  res.redirect(getFrontendBase(req))
}

// Need a means of tracking a possible post-login redirect through the OAuth flow
export const postOauthRedirectMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const { curriedRedirect } = req.query
  if (curriedRedirect && typeof curriedRedirect === 'string') {
    req.session.curriedRedirect = curriedRedirect
  }
  next()
}

export async function recaptchaMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const { recaptcha } = req.query
  if (recaptcha && typeof recaptcha === 'string') {
    const recaptchaResult = await verifyRecaptchaSignup(recaptcha)
    if (!recaptchaResult) {
      // Failure state redirects to the frontend.
      await failureRedirect(req, res, ['auth__bad_recaptcha'])
      return
    }
  }
  next()
}

export function getStateToken(req: express.Request) {
  const user = req.user as UserTypes.User | undefined

  const state: StateParams = {
    mirrorUri: getFrontendUrlFromReq(req),
    mirrorAPIUri: getBackendUrlFromReq(req),
    userId: null,
  }

  if (req.session.linking && user) {
    state.userId = user.id
  }

  return jwt.sign(state, config.jwt.secret, {
    expiresIn: '5 minutes',
    algorithm: 'HS256',
  })
}

const decodeState = (state: string | undefined) => {
  if (state) {
    const decoded = jwt.verify(state, config.jwt.secret, {
      algorithms: ['HS256'],
    })
    if (decoded && isStateParams(decoded)) {
      return decoded
    }
  }
  return null
}

export function getStateDataFromToken(req: express.Request): StateParams {
  const { state } = req.query as { state?: string }
  const { openIdState } = req.session
  const stateToken = state ?? openIdState
  try {
    const decoded = decodeState(stateToken)
    if (decoded) {
      return decoded
    }
  } catch (err) {
    authLogger('getStateDataFromToken', { userId: null }).error(
      'Failed to decode OAuth state token',
      { state, openIdState, stateToken },
      err,
    )
  }
  return { mirrorUri: null, mirrorAPIUri: null, userId: null }
}

export function getFrontendBase(req: express.Request) {
  const { mirrorUri } = getStateDataFromToken(req)
  return mirrorUri ?? config.appSettings.frontendBase
}

export function getBackendBase(req: express.Request) {
  const { mirrorAPIUri } = getStateDataFromToken(req)
  return mirrorAPIUri ?? config.appSettings.backendBase
}

export async function getFailureUrl(
  req: express.Request,
  errors: string[] = [],
) {
  const translatedErrors = (
    await Promise.all(
      errors.map(async error => {
        if (req.user) {
          return translateForUser(req.user, error)
        }
        return translateWithLocale(req.acceptsLanguages(), error)
      }),
    )
  ).filter(error => !!error)
  return translatedErrors
    ? `${getFrontendBase(req)}?authErrors=${JSON.stringify(translatedErrors)}`
    : getFrontendBase(req)
}

interface LinkingPayload {
  uniqueId: string
  userId: string
  accessToken?: string
  name?: string
}

export function confirmLinkMiddleware(
  req: express.Request,
  res: express.Response,
  provider: string,
  linkingPayload: LinkingPayload,
) {
  const confirmLinkParams = new URLSearchParams({
    confirmAccountLink: 'true',
    provider,
    ...linkingPayload,
  })
  res.redirect(`${getFrontendBase(req)}?${confirmLinkParams.toString()}`)
}

export function confirmSignupMiddleware(
  req: express.Request,
  res: express.Response,
  provider?: string,
) {
  const confirmSignupParams = new URLSearchParams({ confirmSignup: 'true' })
  if (provider) {
    confirmSignupParams.set('provider', provider)
  }
  res.redirect(`${getFrontendBase(req)}?${confirmSignupParams.toString()}`)
}

export async function confirmLinkRoute(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
  provider: string,
) {
  const { userId, uniqueId, password } = req.query
  if (
    !userId ||
    typeof userId !== 'string' ||
    !uniqueId ||
    typeof uniqueId !== 'string' ||
    !password ||
    typeof password !== 'string'
  ) {
    await failureRedirect(req, res, ['auth__password_mismatch'], provider)
    return
  } else {
    const existingUser = await getUserById(userId)
    if (!existingUser) {
      await failureRedirect(req, res, ['auth__password_mismatch'], provider)
      return
    }
    try {
      const loginResult = await verifyUserLogin(existingUser.email, password)

      if ('requiresPasswordReset' in loginResult) {
        await failureRedirect(
          req,
          res,
          ['auth__password_reset_required'],
          provider,
        )
        return
      }

      const { user } = loginResult
      if (provider === 'google') {
        const { accessToken, name } = req.query
        if (!accessToken || !name) {
          await failureRedirect(req, res, ['auth__password_mismatch'], provider)
          return
        }
        await setOauthProviderForUser(user.id, provider, uniqueId, {
          accessToken,
          name,
        })
        // Automatically verify the email for the user if not verified
        if (!user.emailVerified) {
          await updateUser(userId, { emailVerified: true })
        }
        req.user = user
      }
    } catch (err) {
      await failureRedirect(req, res, [err.message], provider)
      return
    }
  }
  next()
}

export async function failureRedirect(
  req: express.Request,
  res: express.Response,
  errors: string[] = [],
  provider?: string,
) {
  // Special case for unintentional signup
  if (
    errors.find(error => error === 'auth__oauth_user_not_exists') &&
    !req?.session?.signup
  ) {
    confirmSignupMiddleware(req, res, provider)
    return
  }
  res.redirect(await getFailureUrl(req, errors))
}
