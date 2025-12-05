import { Router } from 'express'
import moment from 'moment'
import json2csv from 'json2csv'
import _ from 'underscore'

import { io } from 'src/system'
import { sessionStore } from 'src/util/store'
import { type RoobetReq } from 'src/util/api'
import { api } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { User } from 'src/modules/user/documents/user'
import {
  createNotification,
  getUserById,
  lockUser,
  timedLockUser,
  unlockUser,
} from 'src/modules/user'
import { getPaginatedDeposits } from 'src/modules/deposit/documents/deposit_transactions_mongo'
import { getIpsForUserId } from 'src/modules/fraud/geofencing/documents/ip_tracer'
import { getPaginatedWithdrawals } from 'src/modules/withdraw/documents/withdrawals_mongo'
import { getUserSessionsByUser } from 'src/modules/auth/documents/user_session'
import { getBetHistoryForUser } from 'src/modules/bet/documents/bet_history_mongo'
import { fetchBlockioOrEthereumWallet } from 'src/modules/crypto/lib/wallet'
import {
  deleteSpamComplaint,
  deleteUnsubscribe,
  deleteBounce,
} from 'src/vendors/mailgun'
import { sumUserStatFields } from 'src/modules/stats/documents/userStats'
import {
  getTransactionHistoryForUser,
  tableSearchTransactions,
} from 'src/modules/user/documents/transaction'
import { claimRoowards } from 'src/modules/roowards/lib'
import {
  adminClearAffiliate,
  adminUpdateAffiliate,
} from 'src/modules/affiliate/lib'
import { createAuditRecord } from 'src/modules/audit'
import { isKYCLevel, isVerifiedKYCLevel } from 'src/modules/fraud/kyc/types'
import { translateForUserId } from 'src/util/i18n'
import {
  updateByUserId,
  updateManualLevelVerification,
} from 'src/modules/fraud/kyc/documents/kyc'
import { revalidateKycLevelForUser } from 'src/modules/fraud/kyc'
import { mapBalanceInformation, totalBalance } from 'src/modules/user/balance'

import { addAdminNoteToUser } from '../lib/userNotes'
import { logAdminAction, roleCheck } from '../middleware'
import { getRippleWalletByTag } from 'src/modules/crypto/ripple/lib'

interface BonusResponse {
  lastBonus: false | Date | string
  sinceLastBonus: {
    deposited: number
    withdrawn: number
    roowardsClaimed: number
  }
  errorReason?: string
  balance: number
  eligibleForBonus: boolean
  netGrossRevenue: number
}

export function createUsersRouter() {
  const router = Router()

  router.get(
    '/calcBonus',
    ...roleCheck([{ resource: 'roowards', action: 'update' }]),
    api.validatedApiCall(async req => {
      const { userId } = req.query
      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('No userId')
      }

      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('No user')
      }

      const payload: BonusResponse = {
        lastBonus: false,
        sinceLastBonus: {
          withdrawn: 0,
          deposited: 0,
          roowardsClaimed: 0,
        },
        balance: 0,
        eligibleForBonus: false,
        netGrossRevenue: 0,
      }

      // Check if the player has any Roowards available for claim.
      const daily = await claimRoowards(user, 'd', true)
      if (daily) {
        payload.errorReason = 'Daily Rooward available for claim.'
        return payload
      }
      const weekly = await claimRoowards(user, 'w', true)
      if (weekly) {
        payload.errorReason = 'Weekly Rooward available for claim.'
        return payload
      }
      const monthly = await claimRoowards(user, 'm', true)
      if (monthly) {
        payload.errorReason = 'Monthly Rooward available for claim.'
        return payload
      }

      let lastBonusDate = null
      const bonusTxns = (
        await tableSearchTransactions(
          1,
          0,
          { timestamp: -1 },
          { userId, type: ['bonus'] },
        )
      ).data
      if (bonusTxns[0]) {
        lastBonusDate = bonusTxns[0].timestamp
      }

      if (!lastBonusDate) {
        // user has never had a bonus, set to 2 weeks ago.
        lastBonusDate = moment().subtract(2, 'weeks').toISOString()
      }
      payload.lastBonus = lastBonusDate

      const userStats = await sumUserStatFields(
        userId,
        // @ts-expect-error string vs Date
        lastBonusDate,
        moment().toISOString(),
        ['deposited', 'withdrawn', 'roowardsClaimed'],
      )
      const deposited = userStats.deposited ?? 0
      payload.sinceLastBonus.deposited = deposited
      const withdrawn = userStats.withdrawn ?? 0
      payload.sinceLastBonus.withdrawn = withdrawn
      const roowardsClaimed = userStats.roowardsClaimed ?? 0
      payload.sinceLastBonus.roowardsClaimed = roowardsClaimed

      const userBalances = await mapBalanceInformation(user)
      const totalUserBalance = totalBalance(userBalances)

      payload.balance = totalUserBalance

      if (totalUserBalance > 20) {
        payload.errorReason =
          'Balance is > $20. Tell player to finish gameplay with that balance before asking for bonus.'
        return payload
      }

      const netGrossRevenue =
        deposited - withdrawn - roowardsClaimed - totalUserBalance
      payload.netGrossRevenue = netGrossRevenue

      if (netGrossRevenue < 0) {
        payload.errorReason = 'Player is up (NGR is positive)'
        return payload
      }

      let bonusRate = 0.075
      if (user.role === 'VIP' || user.role === 'HV') {
        bonusRate = 0.1
      }

      const bonusDue = netGrossRevenue * bonusRate - roowardsClaimed
      if (bonusDue < 5) {
        payload.errorReason = 'Bonus due is not high enough (Less than $5).'
        return payload
      }

      return {
        ...payload,
        bonusDue,
        eligibleForBonus: true,
        maxBonusSeniorSupport: 500,
        maxBonusSupport: 150,
      }
    }),
  )

  router.get(
    '/addressLookup',
    ...roleCheck([{ resource: 'address_lookup', action: 'read' }]),
    api.validatedApiCall(async req => {
      const { address, destinationTag } = req.query
      if (!address && !destinationTag) {
        throw new APIValidationError(
          'Please supply an Address/Destination Tag as a query param.',
        )
      }

      if (address && typeof address !== 'string') {
        throw new APIValidationError('Please supply address as query param.')
      }
      if (destinationTag && typeof destinationTag !== 'string') {
        throw new APIValidationError(
          'Please supply destination tag as a query param.',
        )
      }
      try {
        const wallet = address
          ? await fetchBlockioOrEthereumWallet(address)
          : await getRippleWalletByTag(Number(destinationTag))

        if (wallet) {
          return wallet
        }
      } catch {
        throw new APIValidationError(
          'Address/Destination Tag does not belong to a Roobet player.',
        )
      }
    }),
  )

  router.post(
    '/deleteSuppressions',
    ...roleCheck([{ resource: 'account', action: 'fix_email' }]),
    api.validatedApiCall(async req => {
      const { email } = req.body
      let spamComplaintResponse, bounceResponse, unsubscribeResponse
      try {
        unsubscribeResponse = await deleteUnsubscribe(email)
      } catch (error) {
        unsubscribeResponse = error
      }
      try {
        bounceResponse = await deleteBounce(email)
      } catch (error) {
        bounceResponse = error
      }
      try {
        spamComplaintResponse = await deleteSpamComplaint(email)
      } catch (error) {
        spamComplaintResponse = error
      }

      const response = {
        unsubscribeResponse,
        bounceResponse,
        spamComplaintResponse,
      }
      return response
    }),
  )

  router.post(
    '/requiredKYCLevelForUser',
    api.check,
    ...roleCheck([{ resource: 'kyc', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const {
        userId,
        kycRequiredLevel,
        kycRequiredReason,
        kycRestrictAccount,
      } = req.body

      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('api__missing_param', ['userId'])
      }

      if (!isKYCLevel(kycRequiredLevel)) {
        throw new APIValidationError('api__invalid_param', [
          'kycRequiredLevel = 0,1,2,3,4',
        ])
      }

      if (!kycRequiredReason || typeof kycRequiredReason !== 'string') {
        throw new APIValidationError('api__missing_param', [
          'kycRequiredReason',
        ])
      }

      if (
        kycRestrictAccount !== undefined &&
        typeof kycRestrictAccount !== 'boolean'
      ) {
        throw new APIValidationError('api__invalid_param', [
          'kycRestrictAccount',
        ])
      }

      const [result] = await Promise.all([
        User.get(userId).update({ kycRequiredLevel }).run(),
        // kycRestrictAccount = Lock user systems if needed
        updateByUserId(userId, { kycRestrictAccount, kycRequiredReason }),
      ])

      // Send user notification.
      if (kycRequiredLevel > 0) {
        const notificationMessage = await translateForUserId(
          userId,
          'kyc__needed',
          [`${kycRequiredLevel}`],
        )
        await createNotification(userId, notificationMessage, 'kyc')
      }

      // Add ACP note to user record.
      addAdminNoteToUser(
        userId,
        adminUser,
        `<b>ACP Action:</b> ${adminUser.name} set KYC Required to ${kycRequiredLevel}.`,
      )

      return result
    }),
  )

  router.post(
    '/manualLevelVerification',
    api.check,
    ...roleCheck([{ resource: 'kyc', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, level, value } = req.body

      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('api__missing_param', ['userId'])
      }

      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError(
          'Could not find user from userId provided.',
        )
      }

      if (!isVerifiedKYCLevel(level)) {
        throw new APIValidationError('api__invalid_param', [
          'manualVerificationLevel = 1,2,3,4',
        ])
      }

      const result = await updateManualLevelVerification(userId, level, value)

      if (result) {
        // Add ACP note to user record.
        addAdminNoteToUser(
          userId,
          adminUser,
          `<b>ACP Action:</b> ${adminUser.name} set Manual Verification Level ${level} to ${value}.`,
        )

        await revalidateKycLevelForUser(user, result)
      }

      return result
    }),
  )

  router.post(
    '/addLock',
    ...roleCheck([{ resource: 'account', action: 'update_lock' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, time, reason, note } = req.body

      const auditData = {
        editorId: adminUser.id,
        subjectId: `${userId}`,
        notes: `Reason: ${reason}, Note: ${note}`,
        databaseAction: 'edit',
        actionType: 'userLock',
      } as const

      if (time) {
        await createAuditRecord(auditData, async () => {
          await timedLockUser(userId, reason, time)
        })
      } else {
        await createAuditRecord(
          auditData,
          async () => await lockUser(userId, reason),
        )
      }

      const sessions = await getUserSessionsByUser(userId).select('sessionId')

      for (const session of sessions) {
        sessionStore.destroy(session.sessionId)
      }

      io.to(userId).emit('forceRefresh')

      const noteString = note
        ? ` </br>Note: <span style="font-style: italic">${note}</span>`
        : ''
      addAdminNoteToUser(
        userId,
        adminUser,
        `<b>ACP Action:</b> ${adminUser.name} locked player.
        </br>Reason: <span style="font-style: italic">${reason}</span>${noteString}`,
      )
    }),
  )

  router.post(
    '/removeLock',
    ...roleCheck([{ resource: 'account', action: 'update_lock' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, reason } = req.body
      const auditData = {
        editorId: adminUser.id,
        subjectId: `${userId}`,
        notes: `${reason}`,
        databaseAction: 'edit',
        actionType: 'userUnlock',
      } as const

      const result = await createAuditRecord(
        auditData,
        async () => await unlockUser(userId),
      )

      const reasonString = reason
        ? ` </br>Reason: <span style="font-style: italic">${reason}</span>`
        : ''
      addAdminNoteToUser(
        userId,
        adminUser,
        `<b>ACP Action:</b> ${adminUser.name} un-locked player.${reasonString}`,
      )

      return result
    }),
  )

  router.get(
    '/deposits/export',
    ...roleCheck([{ resource: 'deposits', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      const { userId } = req.query
      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('?userId= required.')
      }
      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('Invalid userId.')
      }
      const { data: items } = await getPaginatedDeposits({
        userId,
        limit: 100000000000,
      })

      const possibleFields = [
        'externalId',
        'depositType',
        'provider',
        'amount',
        'createdAt',
        'meta',
      ] as const
      const data = items.map(item => _.pick(item, ...possibleFields))

      const sheet = json2csv({
        data,
        fields: [...possibleFields],
        fieldNames: [...possibleFields],
      })
      res.attachment(`Deposits - ${user.name}.csv`)
      res.status(200).send(sheet)
    }),
  )

  router.get(
    '/withdrawals/export',
    ...roleCheck([{ resource: 'withdrawals', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      const { userId } = req.query
      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('?userId= required.')
      }

      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('Invalid userId.')
      }

      const { data: items } = await getPaginatedWithdrawals({
        userId,
        limit: 100000000000,
      })

      const fieldsToPick = [
        'plugin',
        'provider',
        'sent',
        'meta',
        'request',
        'totalValue',
        'createdAt',
      ] as const
      const fieldsToProcess = ['transactionId', 'amount'] as const
      const possibleFields = [...fieldsToPick, ...fieldsToProcess] as const
      const data = items.map(item => {
        const datum = _.pick(item, ...fieldsToPick)
        return {
          ...datum,
          amount: item.totalValue,
          transactionId: item.meta ? item.meta.hash : item.transactionId,
        }
      })

      const sheet = json2csv({
        data,
        fields: [...possibleFields],
        fieldNames: [...possibleFields],
      })
      res.attachment(`Withdrawals - ${user.name}.csv`)
      res.status(200).send(sheet)
    }),
  )

  router.get(
    '/transactions/export',
    ...roleCheck([
      { resource: 'deposits', action: 'read' },
      { resource: 'withdrawals', action: 'read' },
    ]),
    api.validatedApiCall(async (req, res) => {
      const { userId } = req.query
      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('?userId= required.')
      }

      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('Invalid userId.')
      }

      const items = await getTransactionHistoryForUser(userId)

      // TODO add portfolio balances to these reports
      const possibleFields = [
        '_id',
        'timestamp',
        'currentBalance',
        'currentEthBalance',
        'currentLtcBalance',
        'type',
        'amount',
        'balanceType',
      ] as const
      const data = items.map(item => _.pick(item, ...possibleFields))

      const sheet = json2csv({
        data,
        fields: [...possibleFields],
        fieldNames: [...possibleFields],
      })
      res.attachment(`Transactions - ${user.name}.csv`)
      res.status(200).send(sheet)
    }),
  )

  router.get(
    '/bets/export',
    ...roleCheck([{ resource: 'bets', action: 'export' }]),
    api.validatedApiCall(async (req, res) => {
      const { userId } = req.query
      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('?userId= required.')
      }

      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('Invalid userId.')
      }

      const items = await getBetHistoryForUser(userId)

      const possibleFields = [
        '_id',
        'betAmount',
        'payoutValue',
        'gameIdentifier',
        'gameName',
        'timestamp',
        'userId',
      ] as const
      const data = items.map(item => _.pick(item, ...possibleFields))

      const sheet = json2csv({
        data,
        fields: [...possibleFields],
        fieldNames: [...possibleFields],
      })
      res.attachment(`Bets - ${user.name}.csv`)
      res.status(200).send(sheet)
    }),
  )

  router.get(
    '/ips/export',
    ...roleCheck([{ resource: 'iplookup', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      const { userId } = req.query
      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('?userId= required.')
      }

      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('Invalid userId.')
      }

      const items = await getIpsForUserId(userId)

      const possibleFields = ['ip', 'uses', 'createdAt'] as const
      const data = items.map(item => _.pick(item, ...possibleFields))

      const sheet = json2csv({
        data,
        fields: [...possibleFields],
        fieldNames: [...possibleFields],
      })
      res.attachment(`IPs - ${user.name}.csv`)
      res.status(200).send(sheet)
    }),
  )

  router.post(
    '/changeAffiliate',
    api.check,
    ...roleCheck([{ resource: 'account', action: 'update_affiliate_id' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId, affiliateName, clear } = req.body
      const { user: staffUser } = req as RoobetReq

      if (!userId) {
        throw new APIValidationError('api__missing_param', ['userId'])
      }

      if (!affiliateName && !clear) {
        throw new APIValidationError('api__missing_param', [
          'affiliateName/clear',
        ])
      }
      const staffUserId = staffUser.id

      if (clear) {
        await adminClearAffiliate(userId, staffUserId)
      } else {
        await adminUpdateAffiliate(userId, affiliateName, staffUserId)
      }
    }),
  )

  return router
}
