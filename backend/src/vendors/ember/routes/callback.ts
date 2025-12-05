import express, { type Router } from 'express'

import { api } from 'src/util/api'
import { getUserById, updateUser } from 'src/modules/user'
import { creditBalance } from 'src/modules/user/balance'
import { modifyBetGoal } from 'src/modules/user/lib/betGoal'

import { getEmberAccount } from '../documents'
import { verifyEmberRequestMiddleware } from '../middleware'
import { emberLogger } from '../lib'
import { verifyRequestParamsMiddleware } from '../middleware/emberRequestParamVerification'

const asyncCallback = api.scopedAsyncCallback(emberLogger)

export const createEmberCallbackRouter = (app: Router) => {
  const router = express.Router()
  app.use('/', router)

  router.post(
    '/transfer',
    verifyEmberRequestMiddleware,
    verifyRequestParamsMiddleware,
    asyncCallback(async (req, res, _next, logger) => {
      const { ember_user_id, amount_usd } = req.body

      if (amount_usd <= 0 || amount_usd > 3000) {
        logger.debug('Invalid amount_usd', { amount_usd })
        res.json({ success: false, detail: 'Invalid param: [amount_usd]' })
        return
      }

      const linkedAccount = await getEmberAccount(ember_user_id)
      if (!linkedAccount) {
        logger.debug('No linked account found for this emberId', {
          ember_user_id,
        })
        res.json({
          success: false,
          detail: 'No linked account found for this emberId',
        })
        return
      }

      const linkedUser = await getUserById(linkedAccount.userId)
      if (!linkedUser) {
        logger.debug('No linked user found for this emberId', { ember_user_id })
        res.json({
          success: false,
          detail: 'No linked user found for this emberId',
        })
        return
      }

      try {
        const balanceResponse = await creditBalance({
          user: linkedUser,
          amount: amount_usd,
          transactionType: 'emberTransfer',
          // Ember has requested we only credit to BTC balance.
          balanceTypeOverride: 'crypto',
          meta: { emberUserId: ember_user_id },
        })
        if (balanceResponse.transactionId) {
          await modifyBetGoal(
            linkedUser.id,
            amount_usd * 0.2,
            // Ember has requested we only credit to BTC balance.
            'crypto',
          )
          // Ember transfer should change the selected balance to crypto
          await updateUser(linkedUser.id, {
            selectedBalanceField: 'balance',
          })
          res.json({ success: true, detail: 'Transfer successful' })
        } else {
          logger.debug('Failed to credit balance for transfer', {
            balanceResponse,
          })
          res.json({
            success: false,
            detail: 'Failed to credit balance for transfer',
          })
        }
      } catch (error) {
        logger.error('Error crediting balance for transfer', { error })
        res.json({ success: false, detail: error.message })
      }
    }),
  )
}
