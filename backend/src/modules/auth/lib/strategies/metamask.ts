import passport from 'passport-strategy'
import { recoverPersonalSignature } from '@metamask/eth-sig-util'
import { type Request } from 'express'

import { type Types as UserTypes } from 'src/modules/user'
import { getMetamaskNonce } from 'src/modules/auth/documents/user_password'

import { findUserByOauthProvider, setOauthProviderForUser } from '../oauth'

export interface MetamaskStrategyOptions {
  passReqToCallback: boolean
}

export interface MetamaskRequestArguments {
  address?: string
  signature?: string
}

export interface MetamaskVerifiedArguments {
  err?: Error
  message?: string
  user?: UserTypes.User
}

export type VerifyFunction = (
  req: Request,
  address: string,
  cb: (args: MetamaskVerifiedArguments) => void,
) => Promise<void>

/**
 * Please note, this Passport Strategy is not fully featured and is custom built
 * to serve the purpose of our OAuth flow and nothing more. If at some point in the
 * future we want this to be more robust, it can be. For now, things like `_passReqToCallback`
 * are just assumed, because that's how we do authentication here.
 */
export class MetamaskStrategy extends passport.Strategy {
  private readonly _verifyFunction: VerifyFunction

  private readonly _passReqToCallback: boolean

  constructor(
    options: MetamaskStrategyOptions,
    verifyFunction: VerifyFunction,
  ) {
    super()

    this._verifyFunction = verifyFunction
    this._passReqToCallback = options.passReqToCallback

    passport.Strategy.call(this)
  }

  async verify(req: Request, address: string, signature: string) {
    const verified = ({ err, user, message }: MetamaskVerifiedArguments) => {
      if (err) {
        this.error(err)
        return
      }
      if (!user) {
        this.fail({ message: message ?? 'Unauthorized' }, 401)
        return
      }
      this.success(user)
    }

    const isLinking = req?.session?.linking && !!req.user
    const preExistingUser = await findUserByOauthProvider('metamask', address)
    if (preExistingUser && isLinking) {
      this.fail({ message: 'Unauthorized' }, 401)
      return
    }
    const existingUser = isLinking ? req.user : preExistingUser
    if (existingUser && isLinking) {
      await setOauthProviderForUser(existingUser.id, 'metamask', address, {
        address,
        name: '',
      })
      // Account has been linked, no further use for this
      req.session.linking = false
    }

    if (!existingUser) {
      this.fail({ message: 'Unauthorized' }, 401)
      return
    }

    const nonce = await getMetamaskNonce(existingUser.id)

    /**
     * @todo Figure out how to translate this
     * We must ensure that the message is the same on the frontend and backend, otherwise the signature will not match.
     */
    const message = `Signing one-time nonce ${nonce} for Roobet authentication.`
    const data = `0x${Buffer.from(message, 'utf8').toString('hex')}`

    const msgToVerify = { data, signature }
    const returnAddress = recoverPersonalSignature(msgToVerify)

    if (returnAddress !== address) {
      verified({ message: 'The address did not match the signature' })
      return
    }

    await this._verifyFunction(req, address, verified)
  }

  override async authenticate(req: Request) {
    const { address, signature } = req.query as MetamaskRequestArguments

    if (!address || !signature) {
      this.fail({ message: 'Missing credentials' }, 400)
      return
    }

    try {
      /**
       * Assumption of `_passReqToCallback`.
       * Normally, this would be wrapped in an if statement.
       * Considering we don't pass around session ids in URI query params, we don't
       * currently need to consider it.
       */
      await this.verify(req, address, signature)
    } catch (err) {
      this.error(err)
    }
  }
}
