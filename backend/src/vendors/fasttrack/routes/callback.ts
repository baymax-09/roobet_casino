import { Router } from 'express'

import { translateForUserId } from 'src/util/i18n'
import { getUserById, userIsLocked, createNotification } from 'src/modules/user'
import { APIValidationError } from 'src/util/errors'
import { api } from 'src/util/api'
import { decodeToken } from 'src/modules/auth'
import { creditBalance, isBalanceType } from 'src/modules/user/balance'
import { getAllBonusCodes } from 'src/modules/crm/documents'
import { initiateBonusCode } from 'src/modules/crm'
import { getArchivedUserByRethinkId } from 'src/modules/user/documents/archive'

import {
  validateRequestMiddleWare,
  getUserDetails,
  updateConsents,
  getConsents,
} from '../lib'
import { publishUserConsentMessageToFastTrack } from '../rabbitmq'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'
import { fasttrackLogger } from '../lib/logger'

const asyncCallback = api.scopedAsyncCallback(fasttrackLogger)

export function callbackRouter(app: Router) {
  const router = Router()

  app.use('/callback', router)

  router.use(validateRequestMiddleWare)

  router.get(
    '/userdetails/:userId',
    asyncCallback(async (req, res, _, logger) => {
      try {
        const userDetails = await getUserDetails(req.params.userId)
        res.json(userDetails)
      } catch (error) {
        logger.error('error', {}, error)
      }
    }),
  )

  router.get(
    '/userblocks/:userId',
    asyncCallback(async (req, res) => {
      const { userId } = req.params

      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('Missing userId parameter.')
      }

      const user = await getUserById(userId)

      if (!user) {
        // Block all archived users
        const archivedUser = await getArchivedUserByRethinkId(userId)

        if (!archivedUser) {
          throw new APIValidationError('Invalid userId provided.')
        }

        res.json({
          blocks: [
            {
              active: false,
              type: 'Excluded',
              // note: 'Exclusion reason',
            },
            {
              active: true,
              type: 'Blocked',
              note: 'User account deleted.',
            },
          ],
        })
        return
      }

      const userLocked = await userIsLocked(user)

      res.json({
        blocks: [
          {
            active: false,
            type: 'Excluded',
            // note: 'Exclusion reason',
          },
          {
            active: userLocked,
            type: 'Blocked',
            note: user.lockReason,
          },
        ],
      })
    }),
  )

  router.get(
    '/userconsents/:userId',
    asyncCallback(async (req, res, _, logger) => {
      try {
        const userId = req.params.userId

        const user = await getUserById(userId)
        // Return all false consents if the user does not exist
        if (!user) {
          res.json({
            consents: [
              {
                opted_in: false,
                type: 'email',
              },
              {
                opted_in: false,
                type: 'sms',
              },
              {
                opted_in: false,
                type: 'telephone',
              },
              {
                opted_in: false,
                type: 'postMail',
              },
              {
                opted_in: false,
                type: 'siteNotification',
              },
              {
                opted_in: false,
                type: 'pushNotification',
              },
            ],
          })
          return
        }
        const consents = await getConsents(userId)
        res.json(consents)
      } catch (error) {
        logger.error('error', {}, error)
      }
    }),
  )

  router.post(
    '/userconsents/:userId',
    asyncCallback(async (req, res, _, logger) => {
      try {
        await updateConsents(req.params.userId, req.body)
        publishUserConsentMessageToFastTrack(req.params.userId)
        res.status(200).send()
      } catch (error) {
        logger.error('error', {}, error)
        res.status(400).send()
      }
    }),
  )

  router.post(
    '/authenticate',
    asyncCallback(async (req, res, _, logger) => {
      try {
        const token = req.body.sid

        const { user } = await decodeToken(token, 'fasttrack')

        if (!user) {
          res.status(400).send('Invalid sid provided.')
          return
        }

        res.json({ user_id: user.id })
      } catch (error) {
        logger.error('error', {}, error)
        res.status(400).send('Rejected Token.')
      }
    }),
  )

  router.post(
    '/bonus/credit',
    asyncCallback(async (req, res, _, logger) => {
      try {
        const { user_id, bonus_code } = req.body

        if (!user_id) {
          throw new APIValidationError('A valid user_id must be provided.')
        }

        const user = await getUserById(user_id)
        if (!user) {
          throw new APIValidationError(
            'Cannot find user based on user_id provided.',
          )
        }

        if (!bonus_code) {
          throw new APIValidationError('A valid bonus_code must be provided.')
        }

        // Process bonus code for the user
        await initiateBonusCode(
          bonus_code,
          user_id,
          `Bonus Code - ${bonus_code}`,
          'system',
        )

        res.status(200).send()
      } catch (error) {
        logger.error('error', {}, error)
        res
          .status(400)
          .send(error.message || 'Failed to make POST request to credit user.')
      }
    }),
  )

  router.get(
    '/bonus/list',
    asyncCallback(async (_, res) => {
      try {
        const bonusCodes = await getAllBonusCodes()

        res.json({
          Data: bonusCodes.map(bonusCode => ({
            text: bonusCode.description,
            value: bonusCode.name,
          })),
          Success: true,
          Errors: [],
        })
      } catch (error) {
        const errorMessage =
          error.message || 'Failed to make fetch list of bonus codes.'
        res.json({
          Data: [],
          Success: false,
          Errors: [errorMessage],
        })
      }
    }),
  )

  router.post(
    '/bonus/credit/funds',
    asyncCallback(async (req, res, _, logger) => {
      try {
        const { user_id, amount, currency, bonus_code } = req.body

        // Validation
        if (typeof currency !== 'string') {
          throw new APIValidationError('Currency must be a string.')
        }

        const balanceType =
          currency.toLowerCase() === 'btc' ? 'crypto' : currency.toLowerCase()

        if (!isBalanceType(balanceType)) {
          throw new APIValidationError('Currency must be a valid balance type.')
        }

        if (typeof amount !== 'number' || amount <= 0) {
          throw new APIValidationError(
            'Amount must be a number greater than 0.',
          )
        }

        if (!user_id) {
          throw new APIValidationError('A valid user_id must be provided.')
        }

        const user = await getUserById(user_id)
        if (!user) {
          throw new APIValidationError(
            'Cannot find user based on user_id provided.',
          )
        }

        // Credit users account
        await creditBalance({
          user,
          amount,
          meta: { provider: 'fasttrack', bonus_code },
          transactionType: 'bonus',
          balanceTypeOverride: balanceType,
        })

        // Send user a notification that they have received their bonus money
        const convertedAmount = await exchangeAndFormatCurrency(amount, user)
        const notificationMessage = await translateForUserId(
          user.id,
          'fasttrack__convertedBonus',
          [`${convertedAmount}`],
        )
        await createNotification(user.id, notificationMessage, 'cashback')
        res.status(200).send()
      } catch (error) {
        logger.error('error', {}, error)
        res
          .status(400)
          .send(
            error.message ||
              'Failed to make POST request to credit user funds.',
          )
      }
    }),
  )

  return router
}
