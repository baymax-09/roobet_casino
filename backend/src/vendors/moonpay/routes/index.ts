import express from 'express'

import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { config } from 'src/system'
import { createUserWallet, getUserWallet } from 'src/modules/crypto/lib/wallet'
import { type Crypto, type CryptoSymbol } from 'src/modules/crypto/types'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'
import {
  type CryptoBalanceType as MoonpayBalanceTypes,
  isCryptoBalanceType as isMoonpayBalanceType,
} from 'src/modules/user/balance'

import { signUrl } from '../lib/sign'

interface MoonpayBalanceTypeMap {
  crypto: Crypto
  currencyCode: CryptoSymbol
}

const BALANCE_TYPE_MAP: Readonly<
  Record<MoonpayBalanceTypes, MoonpayBalanceTypeMap>
> = {
  crypto: {
    crypto: 'Bitcoin',
    currencyCode: 'btc',
  },
  eth: {
    crypto: 'Ethereum',
    currencyCode: 'eth',
  },
  ltc: {
    crypto: 'Litecoin',
    currencyCode: 'ltc',
  },
  usdt: {
    crypto: 'Tether',
    currencyCode: 'usdt',
  },
  usdc: {
    crypto: 'USDC',
    currencyCode: 'usdc',
  },
  xrp: {
    crypto: 'Ripple',
    currencyCode: 'xrp',
  },
  doge: {
    crypto: 'Dogecoin',
    currencyCode: 'doge',
  },
  trx: {
    crypto: 'Tron',
    currencyCode: 'trx',
  },
}

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/moonpay', router)

  router.get(
    '/getUrl',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async (req, res) => {
      const { user } = req as RoobetReq
      const { amount, selectedBalanceType, redirect } = req.query

      if (!user.kycLevel) {
        throw new APIValidationError('kyc__needed', ['1'])
      }

      if (!isMoonpayBalanceType(selectedBalanceType)) {
        throw new APIValidationError('api__invalid_param', [
          'selectedBalanceType',
        ])
      }
      const { crypto, currencyCode } = BALANCE_TYPE_MAP[selectedBalanceType]

      let wallet = await getUserWallet(user.id, crypto)
      if (!wallet) {
        // temporary dictionary - will be resolved with the TRC20 project
        const network =
          crypto === 'Tether' || crypto === 'USDC' ? 'Ethereum' : crypto
        // TODO wallet refactor - combine these so createUserWallet returns a wallet from mongo
        await createUserWallet(user.id, network)
        wallet = await getUserWallet(user.id, crypto)
      }

      const key = config.moonpay.clientKey
      const envUrl = config.moonpay.envUrl

      let baseUrl = envUrl + key
      baseUrl += `&walletAddress=${wallet?.address}`
      baseUrl += `&currencyCode=${currencyCode}`
      baseUrl += `&baseCurrencyAmount=${amount || 0}`
      baseUrl += '&baseCurrencyCode=usd'
      baseUrl += `&redirectURL=${encodeURIComponent('https://roobet.com')}`
      baseUrl += `&unsupportedRegionRedirectUrl=${encodeURIComponent(
        'https://roobet.com',
      )}`

      if (user.email) {
        baseUrl += `&email=${encodeURIComponent(user.email)}`
      }

      if (redirect) {
        res.redirect(baseUrl)
      }

      return signUrl(baseUrl)
    }),
  )
}
