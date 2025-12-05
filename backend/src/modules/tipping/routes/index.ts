import express from 'express'
import { config } from 'src/system'

import { api, type RouterApp } from 'src/util/api'
import { getIpFromRequest } from 'src/modules/fraud/geofencing'

import { APIValidationError } from 'src/util/errors'
import { createTippingNonceFromRequest, verifyTippingToken } from '../lib'
import { type BalanceType, isBalanceType } from 'src/modules/user/balance'
import { getUserById, getUserByName } from 'src/modules/user'
import { sendTip } from 'src/modules/user/lib/tips'

interface TippingReq {
  userId?: string
  amount?: string
  showInChat?: boolean
  balanceType?: BalanceType
  toUsername?: string
  toUserId?: string
}

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/tipping', router)

  router.get(
    '/token',
    api.check,
    api.validatedApiCall(async (req, res) => {
      const { userId } = req.query as TippingReq
      const { token, success, error } =
        await createTippingNonceFromRequest(userId)
      if (!success) {
        res.status(400).send(error ?? 'An error has occurred')
        return
      }
      res.status(200).send(token)
    }),
  )

  router.post(
    '/send',
    api.validatedApiCall(async (req, res) => {
      const authHeader = req.headers.authorization
      const ip = await getIpFromRequest(req, config.seon.fallbackIPAddress)
      const { userId, toUserId, amount, showInChat, balanceType, toUsername } =
        req.body as TippingReq
      let toUser

      const { success, error } = await verifyTippingToken(userId, authHeader)

      const session = {
        id: req.sessionID,
        data: (req.headers['x-seon-session-payload'] as string) || '',
      }

      if (!userId) {
        throw new APIValidationError('user__does_not_exist')
      }

      const fromUser = await getUserById(userId)

      if (!fromUser) {
        throw new APIValidationError('user__does_not_exist')
      }

      if (!success) {
        throw new APIValidationError(error ?? 'An error has occurred')
      }

      if (showInChat === null) {
        throw new APIValidationError('tip__is_private')
      }

      if (!isBalanceType(balanceType)) {
        throw new APIValidationError('api__invalid_param')
      }

      if (!amount) {
        throw new APIValidationError('invalid_amount')
      }

      const amountNum = parseFloat(amount)
      if (amountNum <= 0 || isNaN(amountNum) || amountNum < 0.01) {
        throw new APIValidationError('invalid_amount')
      }

      if (toUserId && toUsername) {
        throw new APIValidationError('tip__multiple_id')
      }

      if (toUserId) {
        toUser = await getUserById(toUserId)
      }
      if (toUsername) {
        toUser = await getUserByName(toUsername, true)
      }

      if (!toUsername && !toUserId) {
        throw new APIValidationError('user__does_not_exist')
      }

      if (!toUser) {
        throw new APIValidationError('tip__receiver_not_found')
      }

      await sendTip({
        fromUser,
        toUser,
        amount: amountNum,
        isPrivate: !showInChat,
        note: '',
        ip,
        session,
        customBalanceType: balanceType,
      })
    }),
  )
}
