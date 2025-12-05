import express from 'express'

import { api, type RouterApp } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { logAdminAction, roleCheck } from 'src/modules/admin/middleware'
import { getTransactionAndReprocessDeposit } from 'src/modules/crypto/tron/lib'
import { publishRippleInboundTransactionMessage } from 'src/modules/crypto/ripple/rabbitmq'

import { updateDepositTransactionById } from '../documents/deposit_transactions_mongo'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/deposit', router)

  router.post(
    '/updateConfirmations',
    api.check,
    ...roleCheck([{ resource: 'deposits', action: 'update' }]),
    api.validatedApiCall(async req => {
      const { depositId, confirmations } = req.body

      if (isNaN(confirmations)) {
        throw new APIValidationError('Confirmation must be a number')
      }

      const payload = { id: depositId, confirmations }

      await updateDepositTransactionById(payload)

      return { success: true }
    }),
  )

  router.post(
    '/transaction/process',
    api.check,
    ...roleCheck([{ resource: 'deposits', action: 'update' }]),
    logAdminAction,

    api.validatedApiCall(async (req, res) => {
      const { id, network } = req.body
      if (network === 'Ripple') {
        await publishRippleInboundTransactionMessage({
          hashes: [id],
          network: 'Ripple',
        })
      }

      if (network === 'Tron') {
        const result = await getTransactionAndReprocessDeposit(id)
        if (!result.success) {
          throw new APIValidationError(result.error.message)
        }
      }

      res.json({ success: true })
    }),
  )
}
