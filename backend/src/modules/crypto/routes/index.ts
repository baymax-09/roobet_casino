import express from 'express'
import Web3 from 'web3'

import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { Mutex } from 'src/util/redisModels'
import { checkSystemEnabled } from 'src/modules/userSettings'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'

import { generateNonce } from 'src/modules/crypto/lib'
import {
  createUserWalletAuth,
  getUserWalletAuth,
} from 'src/modules/crypto/documents/user_wallet_auth'
import {
  createUserWallet,
  fetchBlockioOrEthereumWalletByUserId,
} from 'src/modules/crypto/lib/wallet'
import {
  getSignedUserWallet,
  createSignedUserWallet,
  removeSignedUserWallet,
} from '../documents/signed_user_wallet'
import { isBlockioCryptoProperName, isValidCrypto } from '../types'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/crypto', router)

  router.get(
    '/associatedWallet',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const nextNonce = generateNonce()
      const existingWallet = await getSignedUserWallet(user.id)

      if (existingWallet) {
        return {
          address: existingWallet.address,
          signature: existingWallet.signature,
        }
      }

      const response = await createUserWalletAuth({
        userId: user.id,
        nonce: nextNonce,
        address: '',
      })

      if (response) {
        return { nonce: response.nonce }
      }
    }),
  )

  router.delete(
    '/associatedWallet',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq

      await removeSignedUserWallet(user.id)
    }),
  )

  router.post(
    '/createNewWallet',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { crypto } = req.body
      // We only want to generate new crypto addresses for btc or ltc (PD-2550)
      if (!isBlockioCryptoProperName(crypto)) {
        throw new APIValidationError('wallet__changed_invalid_crypto', [crypto])
      }

      const locked = await Mutex.checkMutex('newer-createNewWallet', user.id)
      if (locked) {
        throw new APIValidationError('crypto__wait_5_changing_address')
      } else {
        Mutex.setMutex('newer-createNewWallet', user.id, 5 * 60)
      }

      if (!user.kycLevel) {
        throw new APIValidationError('kyc__needed', ['1'])
      }

      const newWallet = await createUserWallet(user.id, crypto)
      return { address: newWallet?.address || '' }
    }),
  )

  router.post(
    '/createNewWalletAuth',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { address, signature } = req.body
      const locked = await Mutex.checkMutex(
        'newer-createNewWalletAuth',
        user.id,
      )
      if (locked) {
        throw new APIValidationError('crypto__wait_5_changing_address')
      } else {
        await Mutex.setMutex('newer-createNewWalletAuth', user.id, 5 * 60)
      }

      const userWalletAuth = await getUserWalletAuth(user.id)
      if (!userWalletAuth) {
        // Error and not APIValidationError because the user doesn't need to know
        throw new Error('Missing user wallet auth')
      }

      const web3 = new Web3()
      const account = web3.eth.accounts.recover(userWalletAuth.nonce, signature)
      if (account !== address) {
        // Error and not APIValidationError because the user doesn't need to know
        throw new Error('Invalid signature')
      }

      const signedWalletAuth = await createSignedUserWallet({
        userId: user.id,
        address,
        signature,
      })
      return {
        signature: signedWalletAuth.signature,
        address: signedWalletAuth.address,
      }
    }),
  )

  /*
   * Should return a wallet address for the given cryptocurrency. Creates
   * a wallet for that crypto if none exists.
   */
  router.post(
    '/getWallet',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { crypto } = req.body

      if (!crypto || !isValidCrypto(crypto)) {
        throw new APIValidationError('wallet__no_address')
      }

      const isEnabled = await checkSystemEnabled(user, 'deposit')
      if (!isEnabled) {
        throw new APIValidationError('action__disabled')
      }

      if (!user.kycLevel) {
        throw new APIValidationError('kyc__needed', ['1'])
      }

      const wallet = await fetchBlockioOrEthereumWalletByUserId(user.id, crypto)

      if (!wallet) {
        // temporary dictionary - will be resolved with the TRC20 project
        const network =
          crypto === 'Tether' || crypto === 'USDC' ? 'Ethereum' : crypto
        const newWallet = await createUserWallet(user.id, network)
        return { address: newWallet?.address || '' }
      } else {
        return { address: wallet.address }
      }
    }),
  )
}
