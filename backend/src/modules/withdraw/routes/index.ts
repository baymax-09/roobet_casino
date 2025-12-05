import express from 'express'

import { config } from 'src/system'
import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { twoFactorCheck } from 'src/modules/auth'
import {
  countryIsBannedMiddleware,
  getCountryCodeFromRequest,
  getIpFromRequest,
} from 'src/modules/fraud/geofencing'
import { acquireLock, deleteLock } from 'src/util/named-lock'
import { Mutex } from 'src/util/redisModels'
import { type CountryCodeEnum } from 'src/util/types'

import { withdrawalProcess, withdrawalTransferProcess } from '../'
import { PluginMap } from '../lib/plugins'
import { type WithdrawalRequest } from '../types'
import { getBalanceFromUserAndType } from 'src/modules/user/balance'
import { withdrawLogger } from '../lib/logger'

// This is a purely arbitrary IP address to use as a fallback, do not change.
const FALLBACK_IP = config.seon.fallbackIPAddress

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/withdraw', router)

  app.post(
    '/withdraw/new',
    api.check,
    countryIsBannedMiddleware,
    twoFactorCheck,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      withdrawLogger('/withdraw/new', { userId: req.user?.id ?? null }).info(
        `Withdraw Request`,
        { data: req.body },
      )
      const request: WithdrawalRequest = req.body
      request.userIp = await getIpFromRequest(req, FALLBACK_IP)

      // temporary to resolve a bug in staging
      const countryCode = await getCountryCodeFromRequest(req)

      request.fields.countryCode = countryCode as CountryCodeEnum

      const session = {
        id: req.sessionID,
        data: (req.headers['x-seon-session-payload'] as string) || '',
      }

      const balanceType = PluginMap[request.plugin]
      if (!request || !balanceType) {
        throw new APIValidationError('invalid__withdrawal')
      }
      if (!request.amount) {
        request.amount = 0
      }

      const balanceReturn = await getBalanceFromUserAndType({
        user,
        balanceType,
      })

      if (request.amount > balanceReturn.balance) {
        throw new APIValidationError('withdrawal__low_bal')
      }

      const cooldown = await Mutex.checkMutex('withdraw-request', user.id)
      if (cooldown) {
        throw new APIValidationError('please_wait_seconds', ['10'])
      } else {
        Mutex.setMutex('withdraw-request', user.id, 10)
      }

      await acquireLock([user.id, 'withdraw'], 8000)
      const result = await withdrawalProcess({
        user,
        request,
        balanceTypeOverride: balanceType,
        session,
      })
      await deleteLock([user.id, 'withdraw'])

      return result
    }),
  )

  /**
   * Cash to crypto withdrawal.
   */
  app.post(
    '/withdraw/transfer',
    api.check,
    countryIsBannedMiddleware,
    twoFactorCheck,
    api.validatedApiCall(async req => {
      const user = req.user!
      withdrawLogger('/withdraw/transfer', {
        userId: req.user?.id ?? null,
      }).info(`Withdraw Transfer Request - Cash to Crypto for ${user.id}`, {
        data: req.body,
      })
      const request: WithdrawalRequest = req.body
      request.userIp = await getIpFromRequest(req, FALLBACK_IP)

      // temporary to resolve a bug in staging
      const countryCode = req.headers['cf-ipcountry']

      request.fields.countryCode = countryCode as CountryCodeEnum

      const session = {
        id: req.sessionID,
        data: (req.headers['x-seon-session-payload'] as string) || '',
      }

      const balanceType = PluginMap[request.plugin]
      if (!request || !balanceType) {
        throw new APIValidationError('invalid__withdrawal')
      }
      if (!request.amount) {
        request.amount = 0
      }

      if (request.amount > user.cashBalance) {
        throw new APIValidationError('withdrawal__low_bal')
      }

      const cooldown = await Mutex.checkMutex('withdraw-request', user.id)
      if (cooldown) {
        throw new APIValidationError('please_wait_seconds', ['10'])
      } else {
        Mutex.setMutex('withdraw-request', user.id, 10)
      }

      await acquireLock([user.id, 'withdraw'], 8000)
      const result = await withdrawalTransferProcess({
        user,
        request,
        balanceTypeOverride: balanceType,
        session,
      })
      await deleteLock([user.id, 'withdraw'])

      return result
    }),
  )
}
