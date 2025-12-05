import express from 'express'

import { config } from 'src/system'
import { getUserById } from 'src/modules/user'
import { type Router, api } from 'src/util/api'
import { getSelectedBalanceFromUser } from 'src/modules/user/balance'
import {
  currencyExchange,
  getUserSelectedDisplayCurrency,
} from 'src/modules/currency/lib/currencyFormat'

import {
  processBonusWin,
  processRefund,
  processBet,
  processResult,
  processEndRound,
} from '../lib/transactions'
import {
  convertBalance,
  validateCallbackRequestUserAndCurrency,
  validateCallbackRequestUser,
} from '../lib/utils'
import {
  createPragId,
  displayCurrencyToCurrencyCode,
  displayCurrencyFromRequestCurrency,
  parseCurrencyFromPragId,
  parseUserIdFromPragId,
} from '../lib/currencies'
import { SeamlessWalletStatusCodes } from '../lib/enums'
import { verifyRequestHashMiddleware, generateAuthToken } from '../lib/auth'
import {
  getUserFromAuthTokenWithErrorHandling,
  transactionalProcessWithErrorHandling,
  successResponse,
  errorResponse,
} from '../lib/response'
import { pragmaticLogger } from '../lib/logger'

const asyncCallback = api.scopedAsyncCallback(pragmaticLogger)

const countryCodesNotToSend = ['US', 'UK', 'GB', 'XX'] as const
const dontSend = (value: any): boolean => countryCodesNotToSend.includes(value)

export default function (app: Router) {
  const router = express.Router()
  app.use('/callback', router)

  router.use(verifyRequestHashMiddleware)

  router.post(
    '/authenticate.html',
    asyncCallback(async (req, res, _, logger) => {
      const { token } = req.body

      const user = await getUserFromAuthTokenWithErrorHandling(
        'authenticate',
        token,
        '',
        false,
      )
      if (!user) {
        logger.info('user not found', {
          body: req.body,
        })
        errorResponse(
          res,
          'User not found',
          SeamlessWalletStatusCodes.PLAYER_NOT_FOUND,
        )
        return
      }

      const displayCurrency = await getUserSelectedDisplayCurrency(user.id)
      const sessionToken = generateAuthToken(user)
      const balanceReturn = await getSelectedBalanceFromUser({ user })
      const displayBalance = await currencyExchange(
        balanceReturn.balance,
        displayCurrency,
        true,
      )

      try {
        const response = {
          userId: createPragId(user.id, displayCurrency),
          currency: displayCurrencyToCurrencyCode(displayCurrency),
          cash: convertBalance(displayBalance),
          bonus: 0.0,
          token: sessionToken,
          country: dontSend(user.countryCode)
            ? config.overrideCountryCode
            : user.countryCode,
        }
        logger.info('response', {
          headers: res.getHeaders(),
          response,
        })
        successResponse(res, response)
      } catch (error) {
        logger.error('error', {}, error)
        errorResponse(
          res,
          'Invalid token',
          SeamlessWalletStatusCodes.INVALID_TOKEN,
        )
      }
    }),
  )

  router.post(
    '/balance.html',
    asyncCallback(async (req, res) => {
      const { userId } = req.body
      const userCurrency = parseCurrencyFromPragId(userId)

      const { valid, user } = await validateCallbackRequestUser(
        'balance',
        req,
        res,
      )
      if (!valid) {
        return
      }

      const balanceReturn = await getSelectedBalanceFromUser({ user })
      const displayCurrency =
        displayCurrencyFromRequestCurrency(userCurrency) ||
        (await getUserSelectedDisplayCurrency(user.id))
      const displayBalance = await currencyExchange(
        balanceReturn.balance,
        displayCurrency,
        true,
      )

      successResponse(res, {
        currency: displayCurrencyToCurrencyCode(displayCurrency),
        cash: convertBalance(displayBalance) || 0,
        bonus: 0.0,
      })
    }),
  )

  router.post(
    '/bet.html',
    asyncCallback(async (req, res) => {
      const { valid, requestCurrency, user } =
        await validateCallbackRequestUserAndCurrency('bet', req, res)
      if (!valid) {
        return
      }

      const process = async () =>
        await processBet(user, req.body, requestCurrency)
      await transactionalProcessWithErrorHandling(
        'bet',
        res,
        user,
        req.body,
        process,
      )
    }),
  )

  router.post(
    '/result.html',
    asyncCallback(async (req, res) => {
      const { valid, requestCurrency, user } =
        await validateCallbackRequestUserAndCurrency('result', req, res)
      if (!valid) {
        return
      }

      const process = async () =>
        await processResult(user, req.body, requestCurrency)
      await transactionalProcessWithErrorHandling(
        'result',
        res,
        user,
        req.body,
        process,
      )
    }),
  )

  router.post(
    '/bonusWin.html',
    asyncCallback(async (req, res) => {
      const { valid, user } = await validateCallbackRequestUser(
        'bonusWin',
        req,
        res,
      )
      if (!valid) {
        return
      }

      const process = async () => await processBonusWin(user, req.body)
      await transactionalProcessWithErrorHandling(
        'bonusWin',
        res,
        user,
        req.body,
        process,
      )
    }),
  )

  router.post(
    '/jackpotWin.html',
    asyncCallback(async (req, res) => {
      const { valid, requestCurrency, user } =
        await validateCallbackRequestUserAndCurrency('jackpotWin', req, res)
      if (!valid) {
        return
      }

      const process = async () =>
        await processResult(user, req.body, requestCurrency)
      await transactionalProcessWithErrorHandling(
        'jackpotWin',
        res,
        user,
        req.body,
        process,
      )
    }),
  )

  /*
   * make sure when you win a promo it does not call result.html as well as promoWin.html
   * otherwise it will double payout.
   */
  router.post(
    '/promoWin.html',
    asyncCallback(async (req, res) => {
      const { valid, requestCurrency, user } =
        await validateCallbackRequestUserAndCurrency('promoWin', req, res)
      if (!valid) {
        return
      }

      const process = async () =>
        await processResult(user, req.body, requestCurrency)
      await transactionalProcessWithErrorHandling(
        'promoWin',
        res,
        user,
        req.body,
        process,
      )
    }),
  )

  router.post(
    '/endRound.html',
    asyncCallback(async (req, res) => {
      const { valid, requestCurrency, user } =
        await validateCallbackRequestUserAndCurrency('endRound', req, res)
      if (!valid) {
        return
      }

      const process = async () =>
        await processEndRound(user, req.body, requestCurrency)
      req.body.reference = `endRound:${req.body.roundId}`
      await transactionalProcessWithErrorHandling(
        'endRound',
        res,
        user,
        req.body,
        process,
      )
    }),
  )

  router.post(
    '/refund.html',
    asyncCallback(async (req, res) => {
      const { userId } = req.body
      const roobetUserId = parseUserIdFromPragId(userId)
      const user = await getUserById(roobetUserId)
      if (!user) {
        errorResponse(
          res,
          'That player does not exist',
          SeamlessWalletStatusCodes.PLAYER_NOT_FOUND,
        )
        return
      }

      const process = async () => await processRefund(user, req.body)
      await transactionalProcessWithErrorHandling(
        'refund',
        res,
        user,
        req.body,
        process,
      )
    }),
  )
}
