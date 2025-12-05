import fs from 'fs'
import { Router } from 'express'
import { getUserById } from 'src/modules/user'
import { config } from 'src/system'

import {
  getBalanceFromUser,
  slotegratorErrorMiddleware,
  SlotegratorError,
  makeValidateSignatureMiddleware,
  serializeRequestCurrency,
} from '../../common'
import { handleSlotegratorEvent } from '../lib/actions'

import { selfValidate } from '../lib'
import { api } from 'src/util/api'
import { slotsLogger } from '../lib/logger'

interface BalanceRequest {
  action: 'balance'
  player_id: string
  currency: string
  session_id: string
}

interface BalanceResponse {
  balance: number
}

const validateSignature = makeValidateSignatureMiddleware(
  config.slotegrator.slots.merchantKey,
)

const asyncCallback = api.scopedAsyncCallback(slotsLogger)

export function createCallbackRouter() {
  const router = Router()

  /**
   * Balance inquiry.
   *
   * This callback endpoint is handled differently and as such is
   * not grouped with the other actions.
   */
  router.post(
    '/',
    validateSignature,
    asyncCallback(async (req, res, next, logger) => {
      try {
        const { action } = req.body

        if (action === 'balance') {
          const { player_id, session_id, currency } = req.body as BalanceRequest

          const user = await getUserById(player_id)

          if (!user) {
            throw new SlotegratorError('User not found.')
          }

          const requestCurrency = serializeRequestCurrency(currency)

          if (!requestCurrency) {
            throw new SlotegratorError('Invalid currency.')
          }

          const response: BalanceResponse = {
            balance: await getBalanceFromUser({
              user,
              externalSessionId: session_id,
              currency: requestCurrency,
            }),
          }

          logger.info('response', {
            response: response.balance,
            requestCurrency,
          })

          res.json(response)
          return
        }

        const response = await handleSlotegratorEvent(action, req.body)

        res.json(response)
      } catch (error) {
        next(error)
      }
    }),
  )

  router.post(
    '/validate',
    asyncCallback(async (_, res) => {
      // This is a debug route, and is only available on local.
      if (!config.isLocal) {
        res.status(403).send('Unauthorized.')
        return
      }

      ;(async () => {
        const response = await selfValidate()

        // Store the results in JSON file at project root.
        fs.writeFileSync(
          './slotegrator-slots-self-validate.json',
          JSON.stringify(response),
        )
      })()

      res.json({ success: true })
    }),
  )

  // Error middleware for every route, do not remove or move.
  router.use(slotegratorErrorMiddleware)

  return router
}
