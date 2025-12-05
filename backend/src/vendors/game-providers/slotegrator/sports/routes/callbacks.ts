import { Router } from 'express'

import { getUserById } from 'src/modules/user'
import { config } from 'src/system'
import { api } from 'src/util/api'

import { handleSlotegratorEvent } from '../lib'
import {
  getBalanceFromUser,
  slotegratorErrorMiddleware,
  SlotegratorError,
  makeValidateSignatureMiddleware,
} from '../../common'
import { sportsLogger } from '../lib/logger'

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
  config.slotegrator.sports.merchantKey,
)

const asyncCallback = api.scopedAsyncCallback(sportsLogger)

export function createCallbackRouter() {
  const router = Router()

  /**
   * Balance inquiry.
   *
   * This callback endpoint is handled differently and as such is
   * not grouped with the other actions.
   */
  router.post(
    '/balance',
    validateSignature,
    asyncCallback(async (req, res, next) => {
      try {
        const { player_id, session_id } = req.body as BalanceRequest

        const user = await getUserById(player_id)

        if (!user) {
          throw new SlotegratorError('User not found.')
        }

        const response: BalanceResponse = {
          balance: await getBalanceFromUser({
            user,
            externalSessionId: session_id,
          }),
        }

        res.json(response)
      } catch (error) {
        next(error)
      }
    }),
  )

  router.post(
    '/:action',
    validateSignature,
    asyncCallback(async (req, res, next) => {
      try {
        const { action } = req.params

        const response = await handleSlotegratorEvent(action, req.body)
        res.json(response)
      } catch (error) {
        next(error)
      }
    }),
  )

  // Error middleware for every route, do not remove or move.
  router.use(slotegratorErrorMiddleware)

  return router
}
