import { type Request, type Response, type NextFunction } from 'express'

import { translateForUser, translateWithLocale } from 'src/util/i18n'
import { type RouterPassport } from 'src/util/api'
import { generateMetamaskNonce } from 'src/modules/auth/documents/user_password'

import {
  MetamaskStrategy,
  type MetamaskVerifiedArguments,
} from './strategies/metamask'
import {
  findOrCreateUserOauth,
  findUserByOauthProvider,
  doUserSignup,
  setOauthProviderForUser,
  failureRedirect,
  getStateToken,
} from './oauth'

import { authLogger } from './logger'

async function verifyFunction(
  req: Request,
  address: string,
  cb: (args: MetamaskVerifiedArguments) => void,
) {
  const ipCountry = req.headers['cf-ipcountry'] as string | undefined
  try {
    const user = await findOrCreateUserOauth(
      req,
      'metamask',
      address,
      '',
      '',
      ipCountry ?? 'N/A',
      { address, name: '' },
    )
    if (user && !('uniqueId' in user)) {
      // Invalidate the nonce
      await generateMetamaskNonce(user.id)
      cb({ user })
    } else {
      cb({})
    }
  } catch (error) {
    authLogger('metamask/verifyFunction', { userId: null }).error(
      'Metamask OAuth',
      {
        ipCountry: ipCountry ?? 'N/A',
        address,
      },
      error,
    )
    cb({ err: error.message })
  }
}

export function getMetamaskStrategy() {
  return new MetamaskStrategy({ passReqToCallback: true }, verifyFunction)
}

export async function metamaskAuthRoute(
  req: Request,
  res: Response,
  next: NextFunction,
  passport: RouterPassport,
) {
  // Manually assign the query state for Metamask since there is no redirect.
  req.query.state = getStateToken(req)
  passport.authenticate('metamask', async (err, user) => {
    if (user) {
      req.user = user
    }
    if (err) {
      await failureRedirect(req, res, [err], 'metamask')
    } else {
      next()
    }
  })(req, res, next)
}

export async function metamaskNonceRoute(req: Request, res: Response) {
  const { address } = req.query
  if (!address || typeof address !== 'string') {
    // How to translate this if there's no user?
    res
      .status(400)
      .send(
        translateWithLocale(
          req.acceptsLanguages(),
          'auth__metamask_address_missing',
        ),
      )
    return
  }

  // Check if an account exists for this address
  const preExistingUser = await findUserByOauthProvider('metamask', address)
  if (preExistingUser && req?.session?.signup) {
    res
      .status(400)
      .send(translateForUser(req.user, 'auth__user_already_linked'))
    return
  }
  const existingUser = req?.session?.signup
    ? await doUserSignup({ req })
    : preExistingUser
  if (existingUser && req?.session?.signup) {
    await setOauthProviderForUser(existingUser.id, 'metamask', address, {
      address,
      name: '',
    })
  }

  if (!existingUser && !req.user) {
    res
      .status(400)
      .send(
        translateWithLocale(
          req.acceptsLanguages(),
          'auth__metamask_user_not_exists',
        ),
      )
    return
  } else if (existingUser && req.user && req.user.id !== existingUser?.id) {
    res
      .status(400)
      .send(translateForUser(req.user, 'auth__user_already_linked'))
    return
  }

  // One of these must exist
  const userId = req?.user?.id ?? existingUser?.id
  const nonce = await generateMetamaskNonce(userId!)
  res.status(200).send({ nonce })
}
