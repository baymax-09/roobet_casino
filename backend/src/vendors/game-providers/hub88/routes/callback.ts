import moment from 'moment'
import express from 'express'

import { config } from 'src/system'
import { getUserById } from 'src/modules/user'
import { type Router, api } from 'src/util/api'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'
import { getGameCurrency } from 'src/modules/user/lib/gameCurrency'
import { getBalanceFromUserAndType } from 'src/modules/user/balance'

import {
  authMiddleware,
  getUserFromAuthTokenWithErrorHandling,
} from '../lib/auth'
import { transactionalProcessWithErrorHandling } from '../lib/transactional'
import { processBet, processWin, processRollback } from '../lib/transactions'
import {
  convertBalanceToAmount,
  successResponse,
  errorResponse,
} from '../lib/utils'
import { displayCurrencyToCurrencyCode } from '../lib/currencies'
import { StatusCodes } from '../lib/enums'
import {
  setTransactionRolledBack,
  getTransaction,
} from '../documents/transactions'
import { hub88Logger } from '../lib/logger'

const asyncCallback = api.scopedAsyncCallback(hub88Logger)

export default function (app: Router) {
  const router = express.Router()
  app.use('/callback', router)

  router.use(authMiddleware)

  /**
   * @todo use gameSession to pick balanceField
   */
  router.post(
    '/user/balance',
    asyncCallback(async (req, res, _, logger) => {
      const { user: userId, token, game_code } = req.body

      const user = await getUserFromAuthTokenWithErrorHandling(
        '/user/balance',
        res,
        userId,
        token,
      )
      if (!user) {
        return
      }

      try {
        const displayCurrency = await getGameCurrency(
          userId,
          `hub88:${game_code}`,
        )
        const balanceReturn = await getBalanceFromUserAndType({
          user,
          balanceType: user.selectedBalanceType,
        })
        const displayBalance = await currencyExchange(
          balanceReturn.balance,
          displayCurrency,
          true,
        )
        const response = {
          user: user.id,
          status: StatusCodes.RS_OK,
          currency: displayCurrencyToCurrencyCode(displayCurrency),
          balance: convertBalanceToAmount(displayBalance),
        }
        logger.info('response', response)
        successResponse(res, response)
      } catch (error) {
        logger.error('error', {}, error)
        await errorResponse(
          res,
          'Invalid token',
          StatusCodes.RS_ERROR_INVALID_TOKEN,
        )
      }
    }),
  )

  router.post(
    '/user/info',
    asyncCallback(async (req, res, _, logger) => {
      const { user: userId } = req.body

      const user = await getUserById(userId)
      if (!user) {
        return
      }

      try {
        const response = {
          user: user.id,
          status: StatusCodes.RS_OK,
          country:
            user.countryCode && user.countryCode !== 'N/A'
              ? user.countryCode
              : config.overrideCountryCode,
          registration_date: moment(user.createdAt).format('YYYY-MM-DD'),
        }
        logger.info('response', response)
        successResponse(res, response)
      } catch (error) {
        logger.error('error', {}, error)
        await errorResponse(
          res,
          'Invalid token',
          StatusCodes.RS_ERROR_INVALID_TOKEN,
        )
      }
    }),
  )

  router.post(
    '/transaction/bet',
    asyncCallback(async (req, res) => {
      const { token, transaction_uuid, user: userId } = req.body

      const user = await getUserFromAuthTokenWithErrorHandling(
        '/transaction/bet',
        res,
        userId,
        token,
      )
      if (!user) {
        return
      }

      const process = async () => await processBet(user, req.body)
      await transactionalProcessWithErrorHandling(
        'bet',
        res,
        user,
        transaction_uuid,
        process,
        req.body,
      )
    }),
  )

  router.post(
    '/transaction/win',
    asyncCallback(async (req, res) => {
      const { transaction_uuid, user: userId } = req.body

      const user = await getUserById(userId)
      if (!user) {
        return
      }

      const process = async () => await processWin(user, req.body)
      await transactionalProcessWithErrorHandling(
        'win',
        res,
        user,
        transaction_uuid,
        process,
        req.body,
      )
    }),
  )

  router.post(
    '/transaction/rollback',
    asyncCallback(async (req, res) => {
      const {
        transaction_uuid,
        reference_transaction_uuid,
        user: userId,
      } = req.body

      const user = await getUserById(userId)
      if (!user) {
        return
      }

      const process = async () => {
        const existingTransaction = await getTransaction(
          reference_transaction_uuid,
        )
        const response = await processRollback(
          user,
          req.body,
          existingTransaction,
        )
        if (existingTransaction) {
          await setTransactionRolledBack(existingTransaction.transactionId)
        }
        return response
      }

      await transactionalProcessWithErrorHandling(
        'rollback',
        res,
        user,
        transaction_uuid,
        process,
        req.body,
      )
    }),
  )
}
