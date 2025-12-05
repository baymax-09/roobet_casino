import { Router } from 'express'
import moment from 'moment'

import { mongoose } from 'src/system'
import { api, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { acquireLock, deleteLock } from 'src/util/named-lock'

import {
  getUserFacingRoowardsReload,
  getRoowardsReload,
  incrementReloadUses,
} from 'src/modules/roowards/documents/RoowardsReload'
import { creditBalance } from 'src/modules/user/balance'

export function createReloadRoute() {
  const router = Router()

  router.get(
    '/',
    api.validatedApiCall(async (req, res) => {
      const { user } = req as RoobetReq
      const reload = await getUserFacingRoowardsReload(user.id)

      res.json({
        reload,
      })
    }),
  )

  router.post(
    '/claim',
    api.validatedApiCall(async req => {
      try {
        const { user } = req as RoobetReq
        const { id } = req.body
        if (user.roowardsDisabled || user.isPromoBanned) {
          throw new APIValidationError('roowards__disabled')
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new APIValidationError('api__invalid_param', ['id'])
        }

        await acquireLock([user.id, 'roowards/reload/claim'], 600000)

        const reload = await getRoowardsReload(id, user.id)

        if (
          !reload ||
          Date.now() > reload.expiresAt.getTime() ||
          reload.totalClaims >= reload.maxClaims
        ) {
          await deleteLock([user.id, 'roowards/reload/claim'])

          return {
            success: false,
            expired: true,
          }
        }

        if (reload.lastClaimedAt) {
          const elapsed = (Date.now() - reload.lastClaimedAt.getTime()) / 1000

          if (elapsed < reload.interval) {
            const mElapsedAt = moment(reload.lastClaimedAt).add(
              reload.interval,
              's',
            )
            throw new APIValidationError(
              `Please wait ${mElapsedAt.fromNow(true)}`,
            )
          }
        }

        const lastClaimedAt = new Date()
        const recharge = await incrementReloadUses(id, lastClaimedAt)

        await creditBalance({
          user,
          amount: reload.amount,
          meta: { issuerId: reload.issuerId ?? '' },
          transactionType: 'roowardsReload',
          balanceTypeOverride: reload.currency,
        })

        await deleteLock([user.id, 'roowards/reload/claim'])

        return {
          lastClaimedAt,
          success: true,
          currency: reload.currency,
          amount: reload.amount,
          totalClaims: recharge?.totalClaims ?? 0,
        }
      } catch (err) {
        const { user } = req as RoobetReq
        await deleteLock([user.id, 'roowards/reload/claim'])
        // TODO remove wrapping try-catch when lock is addressed
        throw err
      }
    }),
  )
  return router
}
