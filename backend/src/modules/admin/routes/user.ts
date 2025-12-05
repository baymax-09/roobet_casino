import express from 'express'
import moment from 'moment'
import numeral from 'numeral'
import json2csv from 'json2csv'
import * as t from 'io-ts'

import {
  r,
  io,
  getFrontendUrlFromReferer,
  getBackendUrlFromReq,
} from 'src/system'
import {
  archiveAndDeleteAccount,
  findArchiveUserByName,
} from 'src/modules/user/documents/archive'
import {
  isDepartment,
  isLegacyUserRole,
  isProduct,
  isCustomerRole,
  isValidManagerInput,
} from 'src/modules/user/types'
import { getMatchPromoForUser } from 'src/modules/promo/documents/match_promo'
import { userIdsWhoShareSamePassword } from 'src/modules/auth/documents/user_password'
import { getActiveMinesGame } from 'src/modules/mines/lib/mines'
import { getActiveTowersGame } from 'src/modules/towers/documents/active_towers_games'
import { slackAdminLog } from 'src/vendors/slack'
import { getMessagesByUserId } from 'src/modules/chat'
import { getUsersWithSameFingerprint } from 'src/modules/user/documents/fingerprint'
import { getPlayersFrb } from 'src/vendors/game-providers/pragmatic/lib/api'
import { getUnusedFreespinsByUserId } from 'src/vendors/game-providers/softswiss/documents/freespins'
import { getActiveBonusesForUser as getActiveSlotegratorBonusesForUser } from 'src/vendors/game-providers/slotegrator/sports'
import {
  User,
  updateUser,
  getUserByName,
  getUserById,
  emailChange,
  getUserByIdOrName,
  getMultipleUsers,
  getUserByIndex,
  isUsernameValid,
} from 'src/modules/user'
import {
  type PortfolioBalanceType,
  type User as UserType,
  type LegacyUserRole,
} from 'src/modules/user/types'
import {
  adminReplaceUserBalance,
  getBalanceFromUserAndType,
  creditBalance,
  adminAddUserBalance,
  isPortfolioBalanceType,
  isBalanceType,
  mapBalanceInformation,
} from 'src/modules/user/balance'
import { KYC } from 'src/modules/fraud/kyc'
import {
  verifyTempTokenForUser,
  generateUserVerificationCode,
} from 'src/modules/auth'
import { sendTwoFactorCode } from 'src/vendors/mailgun'
import {
  changeSystemEnabledUser,
  getSystemSettings,
  isTogglableSystemName,
  isValidSystemName,
} from 'src/modules/userSettings'
import { api, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { getGptHistoryForUser } from 'src/modules/gpt/'
import { getAllWalletsForUser } from 'src/modules/crypto/lib/wallet'
import { getLegacyWalletsByUserId } from 'src/modules/crypto/documents/user_wallet_archive'
import { getRoowardsForUserId } from 'src/modules/roowards/documents/Roowards'
import { getLevels } from 'src/modules/roowards'
import { createNotification } from 'src/modules/messaging'
import { getIpsForUserId } from 'src/modules/fraud/geofencing/documents/ip_tracer'
import { resetBetGoal } from 'src/modules/user/lib/betGoal'
import { getAffiliateTier } from 'src/modules/affiliate/lib'
import { searchFirstAndLastNames } from 'src/modules/fraud/kyc/documents/kyc'
import { getCRMByUserId } from 'src/modules/crm/documents/crm'
import { getUserSessionsByUser } from 'src/modules/auth/documents/user_session'
import { sessionStore } from 'src/util/store'
import { getActiveBonusesForUser } from 'src/vendors/game-providers/hacksaw/lib/bonuses'
import { getBetGoal } from 'src/modules/user/documents/betGoal'
import { getChatBanStatus } from 'src/modules/chat/documents/chat_bans'

import { logAdminAction, roleCheck } from '../middleware'
import { addAdminNoteToUser } from '../lib/userNotes'
import { type TransactionType } from 'src/modules/user/documents/transaction'
import { createAuditRecord } from 'src/modules/audit'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'
import { getActiveLinearMinesGame } from 'src/modules/linearmines/lib/linear_mines'
import { getOrCreateUserConsent } from 'src/modules/crm/lib'
import {
  isConsentType,
  updateConsentForUserId,
} from 'src/modules/crm/documents/consent'
import { publishUserConsentMessageToFastTrack } from 'src/vendors/fasttrack'
import { checkCanPlaceBetOnGame } from 'src/modules/bet/lib/hooks'
import { getGame } from 'src/modules/tp-games/documents/games'
import { UserIdT } from 'src/util/types/userId'
import { getSlotegratorFreespinsForUser } from 'src/vendors/game-providers/slotegrator/slots/documents/slotegratorFreespins'
import { getKOTHEarningsForUser } from 'src/modules/koth/documents/koth_earnings'

export const createUserRouter = () => {
  const router = express.Router()

  router.post(
    '/togglePromoBanned',
    ...roleCheck([{ resource: 'account', action: 'update_promo_banned' }]),
    api.validatedApiCall(async req => {
      const { userId, reason } = req.body
      const { user: adminUser } = req as RoobetReq

      if (!userId) {
        throw new APIValidationError('Missing userId')
      }
      if (typeof req.body.isPromoBanned !== 'boolean') {
        throw new APIValidationError('Invalid isPromoBanned')
      }
      if (!reason || reason.length === 0) {
        throw new APIValidationError('Must give reason')
      }

      addAdminNoteToUser(
        userId,
        adminUser,
        `<b>ACP Action:</b> toggled promo banned ${req.body.isPromoBanned}
         </br>Reason: <span style="font-style: italic">${reason}</span>`,
      )
      await updateUser(userId, {
        isPromoBanned: req.body.isPromoBanned,
      })
    }),
  )

  router.post(
    '/bypassRiskCheck',
    ...roleCheck([{ resource: 'account', action: 'update_risk_check' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, reason, bypass } = req.body

      if (!reason || reason.length === 0) {
        throw new APIValidationError('Must give reason')
      }

      await updateUser(userId, { bypassRiskCheck: bypass })

      addAdminNoteToUser(
        userId,
        adminUser,
        `<b>ACP Action:</b> ${adminUser.name} ${
          bypass ? 'disabled' : 'enabled'
        } risk check.`,
      )
    }),
  )

  router.get(
    '/getAffiliates',
    ...roleCheck([{ resource: 'account', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      const { userId } = req.query
      if (typeof userId !== 'string') {
        throw new APIValidationError('No userId specified')
      }
      // Technically we could still run affiliate reports for deleted users
      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('No such user.')
      }

      const fieldKeys = [
        'createdAt',
        'id',
        'name',
        'hiddenTotalBet',
        'hiddenTotalDeposited',
        'hiddenTotalWithdrawn',
      ] as const
      const fields = [...fieldKeys]
      const affiliates = await User.getAll(userId, { index: 'affiliateId' })
        .pluck(...fieldKeys)
        .run()
      const sheet = json2csv({ data: affiliates, fields, fieldNames: fields })
      res.attachment(
        `Affiliate Report - ${user.name} - ${moment().format(
          'DD-MM-YYYY',
        )}.csv`,
      )
      res.status(200).send(sheet)
    }),
  )

  router.get(
    '/nameLookup',
    ...roleCheck([{ resource: 'account', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      const { name } = req.query
      if (!name || typeof name !== 'string') {
        throw new APIValidationError('No name specified')
      }

      const users = (await searchFirstAndLastNames(name)) ?? []
      if (!users.length) {
        throw new APIValidationError('No users found')
      }

      const ids = users.map(user => user.userId)
      const userEmails = await getMultipleUsers(ids)
      const mappedUsers = users.map(user1 => {
        const user = userEmails.find(user2 => user2.id === user1.userId)
        return user
          ? {
              ...user1,
              email: user.email,
              username: user.name,
            }
          : null
      })
      res.status(200).send(mappedUsers.filter(user => user))
    }),
  )

  router.get(
    '/lookup',
    ...roleCheck([{ resource: 'account', action: 'read' }]),
    api.validatedApiCall(async req => {
      if (
        !req.query.key ||
        typeof req.query.key !== 'string' ||
        req.query.key.length === 0
      ) {
        throw new APIValidationError('No key specified')
      }

      if (typeof req.query.index !== 'string') {
        throw new APIValidationError('No index specified')
      }

      const userData: (UserType & Record<string, any>) | null =
        await getUserByIndex(
          req.query.key.toLowerCase().split(' ').join(''),
          req.query.index,
        )

      if (userData) {
        const portfolioBetGoals = await getBetGoal({ userId: userData.id })
        if (portfolioBetGoals) {
          userData.portfolioBetGoals = Object.keys(portfolioBetGoals)
            .filter(key => isPortfolioBalanceType(key))
            .reduce((cur, key) => {
              const portfolioBalanceType = key as PortfolioBalanceType
              return Object.assign(cur, {
                [key]: portfolioBetGoals[portfolioBalanceType],
              })
            }, {})
        }
      }

      if (!userData) {
        if (req.query.index === 'nameLowercase') {
          // try to run a search for this user on the user archive table..
          const archivedUser = await findArchiveUserByName(
            req.query.key.toLowerCase().split(' ').join(''),
          )

          if (!archivedUser) {
            throw new APIValidationError('No user exists!')
          }

          const currentDepositAddresses = await getAllWalletsForUser(
            archivedUser.id,
          )
          const legacyDepositAddresses = await getLegacyWalletsByUserId(
            archivedUser.id,
          )
          const depositAddresses = [
            ...currentDepositAddresses,
            ...legacyDepositAddresses.map(addr => ({
              ...addr,
              legacy: true,
            })),
          ]

          return {
            user: {
              ...archivedUser,
              isDeleted: true,
            },
            touchedIPs: await getIpsForUserId(archivedUser.id),
            depositAddresses,
            kyc: await KYC.getForUser(archivedUser),
          }
        }
        throw new APIValidationError('No user exists!')
      }

      const affiliateTier = await getAffiliateTier(userData.id)

      const crmDoc = await getCRMByUserId(userData.id)
      const affiliate = {
        refCount: userData.refCount,
        refCxd: crmDoc?.cxd,
        refCxAffId: crmDoc?.cxAffId,
        selfCxAffId: crmDoc?.selfCxAffId,
        refEarnings: userData.referralEarnings,
        refUniqueDepositors: await User.getAll(userData.id, {
          index: 'affiliateId',
        })
          .filter(r.row('hiddenTotalDeposited').gt(0))
          .count()
          .run(),
        refDeposited: await User.getAll(userData.id, { index: 'affiliateId' })
          .sum('hiddenTotalDeposited')
          .run(),
        refDeposits: await User.getAll(userData.id, { index: 'affiliateId' })
          .sum('hiddenTotalDeposits')
          .run(),
        refWithdrawn: await User.getAll(userData.id, { index: 'affiliateId' })
          .sum('hiddenTotalWithdrawn')
          .run(),
        refBet: await User.getAll(userData.id, { index: 'affiliateId' })
          .sum('hiddenTotalBet')
          .run(),
        refWon: await User.getAll(userData.id, { index: 'affiliateId' })
          .sum('hiddenTotalWon')
          .run(),
        refSportsBet: await User.getAll(userData.id, { index: 'affiliateId' })
          .sum('hiddenSportsTotalBet')
          .run(),
        refSportsWon: await User.getAll(userData.id, { index: 'affiliateId' })
          .sum('hiddenSportsTotalWon')
          .run(),
        refRefCount: await User.getAll(userData.id, { index: 'affiliateId' })
          .sum('refCount')
          .run(),
        refRefEarnings: await User.getAll(userData.id, {
          index: 'affiliateId',
        })
          .sum('referralEarnings')
          .run(),
        affiliateCut: affiliateTier.current.cut,
      }

      delete userData.adminLookups

      const passwordUserIds = await userIdsWhoShareSamePassword(userData.id)

      const samePassword = await getMultipleUsers(passwordUserIds)

      const userIdsSameFingerprint = await getUsersWithSameFingerprint(
        userData.id,
      )

      const currentDepositAddresses = await getAllWalletsForUser(userData.id)

      const legacyDepositAddresses = await getLegacyWalletsByUserId(userData.id)

      const depositAddresses = [
        ...currentDepositAddresses,
        ...legacyDepositAddresses.map(addr => ({
          ...addr,
          legacy: true,
        })),
      ]

      const userLookup = {
        user: {
          ...userData,
          isInfluencer: !!crmDoc?.marketing_influencer,
          balances: await mapBalanceInformation(userData),
        },
        sameFingerprints: (
          await getMultipleUsers(userIdsSameFingerprint)
        ).filter(row => row.id !== userData.id),
        roowards: await getRoowardsForUserId(userData.id),
        roowardsLevels: await getLevels(userData),
        depositAddresses,
        offers: (await getGptHistoryForUser(userData.id)).map(row => {
          return { ...row.offer, timestamp: row.timestamp }
        }),
        banStatus: await getChatBanStatus(userData.id),
        affiliate,
        touchedIPs: await getIpsForUserId(userData.id),
        kyc: await KYC.getForUserId(userData.id),
        settings: await getSystemSettings(userData.id),
        chatMessages: await getMessagesByUserId(userData.id),
        pragmaticFreespins: await getPlayersFrb(userData.id),
        softswissFreespins: await getUnusedFreespinsByUserId(userData.id),
        hacksawFreespins: await getActiveBonusesForUser(userData.id),
        slotegratorBonuses: await getActiveSlotegratorBonusesForUser(
          userData.id,
        ),
        slotegratorSlotsFreespins: await getSlotegratorFreespinsForUser(
          userData.id,
        ),
        matchPromo: await getMatchPromoForUser(userData.id),
        samePassword,
        userKOTHEarnings: await getKOTHEarningsForUser(userData.id),
        consentBundle: await getOrCreateUserConsent(userData.id),
      }
      return userLookup
    }),
  )

  router.post(
    '/changeBalance',
    ...roleCheck([{ resource: 'balances', action: 'reset' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { amount, userId, reason, balanceTypeOverride } = req.body
      const newAmount = parseFloat(amount)

      if (!adminUser) {
        throw new APIValidationError('Admin user not provided')
      }

      if (isNaN(newAmount)) {
        throw new APIValidationError('Amount is not a number')
      }

      if (!reason || reason.length === 0) {
        throw new APIValidationError('Must give reason')
      }

      const user = await getUserById(userId)

      if (!user) {
        throw new APIValidationError('User not found')
      }

      // This will be either 'cash' or 'crypto'
      const balanceReturn = await getBalanceFromUserAndType({
        user,
        balanceType: balanceTypeOverride,
      })

      await adminReplaceUserBalance({
        user,
        amount: newAmount,
        meta: { reason, adminId: adminUser.id },
        balanceTypeOverride,
      })

      slackAdminLog(
        `Admin *${adminUser.name}* [${adminUser.id}] just changed *${
          user.name
        }* [${user.id}] ${
          balanceReturn.balanceType
        } from *$${balanceReturn.balance.toFixed(2)}* => *$${newAmount.toFixed(
          2,
        )}* \nReason: ${reason}`,
      )
    }),
  )

  router.post(
    '/updateBulk',
    ...roleCheck([{ resource: 'account', action: 'update_bulk' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { data } = req.body

      if (!data || data.length === 0) {
        throw new APIValidationError('Error. No data given.')
      }

      // Validate all rows.
      const rows = await Promise.all(
        (data as Array<Record<string, any>>).map<
          Promise<{
            error?: string
            user?: UserType
            data?: {
              role: LegacyUserRole
              isSponsor: boolean
              isMarketing: boolean
              isPromoBanned: boolean
            }
          }>
        >(async (row, index) => {
          if (!row.userId && !row.username) {
            return {
              error: `Error (row ${
                index + 1
              }): Either userId or username must be supplied.`,
            }
          }

          if (row.role && !['vip', 'hv'].includes(row.role.trim())) {
            return {
              error: `Error (row ${index + 1}): Role is missing or invalid.`,
            }
          }

          if (
            !row.isSponsor ||
            !['true', 'false'].includes(row.isSponsor.trim())
          ) {
            return {
              error: `Error (row ${
                index + 1
              }): isSponsor must be either true or false.`,
            }
          }

          if (
            !row.isMarketing ||
            !['true', 'false'].includes(row.isMarketing.trim())
          ) {
            return {
              error: `Error (row ${
                index + 1
              }): isMarketing must be either true or false.`,
            }
          }

          if (
            !row.isPromoBanned ||
            !['true', 'false'].includes(row.isPromoBanned.trim())
          ) {
            return {
              error: `Error (row ${
                index + 1
              }): isPromoBanned must be either true or false.`,
            }
          }

          const user = await getUserByIdOrName(
            row.userId?.trim(),
            row.username?.trim(),
            true,
          )

          if (!user) {
            return {
              error: `Error (row ${index + 1}): User ${
                row.userId || row.username
              } does not exist.`,
            }
          }

          return {
            user,
            data: {
              role: row.role.trim() === '' ? null : row.role.trim(),
              isSponsor: row.isSponsor.trim() === 'true',
              isMarketing: row.isMarketing.trim() === 'true',
              isPromoBanned: row.isPromoBanned.trim() === 'true',
            },
          }
        }),
      )

      // Write updates concurrently.
      const responses = await Promise.all(
        rows.map(async row => {
          if (!row.data || row.error || !row.user) {
            return row
          }

          await updateUser(row.user.id, row.data)

          return { id: row.user.id, ...row.data }
        }),
      )
      return { responses, errors: [], successes: [] }
    }),
  )

  router.post(
    '/addBalance',
    ...roleCheck([{ resource: 'balances', action: 'add' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, reason, balanceTypeOverride } = req.body
      let { amount } = req.body
      amount = parseFloat(amount)

      if (isNaN(amount) || amount <= 0) {
        throw new APIValidationError('Amount must be a positive number.')
      }

      if (!reason || reason.length === 0) {
        throw new APIValidationError('Must provide a reason.')
      }

      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('User not found.')
      }
      // This will be either 'cash' or 'crypto'
      const balanceReturn = await adminAddUserBalance({
        user,
        amount,
        meta: { reason, adminId: adminUser.id },
        balanceTypeOverride,
        transactionType: 'adminAddBalance',
      })

      slackAdminLog(
        `Admin *${adminUser.name}* [${adminUser.id}] just added *$${amount}* (${balanceReturn.balanceType}) to *${user.name}* [${user.id}]. \nReason: ${reason}`,
      )
    }),
  )

  router.post(
    '/addBalanceBonus',
    ...roleCheck([{ resource: 'balances', action: 'add' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, reason, balanceTypeOverride } = req.body
      let { amount } = req.body
      amount = parseFloat(amount)

      if (isNaN(amount) || amount <= 0) {
        throw new APIValidationError('Amount must be a positive number.')
      }

      if (!reason || reason.length === 0) {
        throw new APIValidationError('Must provide a reason.')
      }

      const user = await getUserById(userId)

      if (!user) {
        throw new APIValidationError('User not found.')
      }

      const balanceReturn = await adminAddUserBalance({
        user,
        amount,
        transactionType: 'bonus',
        meta: { reason, adminId: adminUser.id },
        balanceTypeOverride,
      })

      await createNotification(
        userId,
        `A bonus of ${await exchangeAndFormatCurrency(
          amount,
          user,
        )} has been added to your wallet.`,
        'cashback',
      )

      slackAdminLog(
        `Admin *${adminUser.name}* [${adminUser.id}] just added bonus of *$${amount}* (${balanceReturn.balanceType}) to *${user.name}* [${user.id}]. \nReason: ${reason}`,
      )
    }),
  )

  router.get(
    '/activeGames',
    ...roleCheck([{ resource: 'account', action: 'read' }]),
    api.validatedApiCall(async req => {
      const { userId } = req.query

      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('api__missing_param', ['userId'])
      }

      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('No such user.')
      }
      let minesGames, towersGames, linearMines
      try {
        minesGames = await getActiveMinesGame(user)
      } catch {}
      try {
        towersGames = await getActiveTowersGame(user)
      } catch {}
      try {
        linearMines = await getActiveLinearMinesGame(user)
      } catch {}

      return { minesGames, towersGames, linearMines }
    }),
  )

  router.post(
    '/addRewardBulk',
    ...roleCheck([{ resource: 'balances', action: 'vip_bulk' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { data, type, reason } = req.body

      if (!data || data.length === 0) {
        throw new APIValidationError('Error. No data given.')
      }

      if (!type || typeof type !== 'string') {
        throw new APIValidationError('No reason given.')
      }

      if (!reason || typeof reason !== 'string') {
        throw new APIValidationError('No reason given.')
      }

      // Validate all of these accounts exist.. throw an error if 1 does not exist.
      const rows = await Promise.all(
        (data as Array<Record<string, any>>).map(async (row, index) => {
          if (
            !row.amount ||
            isNaN(Number(row.amount)) ||
            Number(row.amount) < 0
          ) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Amount is missing or invalid.`,
            )
          }

          if (!row.userId && !row.username) {
            throw new APIValidationError(
              `Error (row ${
                index + 1
              }): Either userId or username must be supplied.`,
            )
          }

          if (row.balanceType && row.balanceType.toLowerCase() === 'btc') {
            row.balanceType = 'crypto'
          }

          if (
            !row.balanceType ||
            !isBalanceType(row.balanceType.toLowerCase())
          ) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Valid balance type must be supplied.`,
            )
          }

          const user = await getUserByIdOrName(
            row.userId?.trim(),
            row.username?.trim(),
            true,
          )

          if (!user) {
            throw new APIValidationError(
              `Error (row ${index + 1}): User ${
                row.userId || row.username
              } does not exist.`,
            )
          }

          return { user, data: row }
        }),
      )

      const transactionType: TransactionType = (() => {
        if (type === 'bonus') {
          return 'bonus'
        }

        return 'adminAddBalance'
      })()

      // Write bonuses concurrently.
      await Promise.allSettled(
        rows.map(async row => {
          const amount = Number(row.data.amount)

          await creditBalance({
            user: row.user,
            amount,
            transactionType,
            meta: { reason, adminId: adminUser.id },
            balanceTypeOverride: row.data.balanceType,
          })

          await createNotification(
            row.user.id,
            `A bonus of ${await exchangeAndFormatCurrency(
              amount,
              row.user,
            )} has been added to your wallet.`,
            'cashback',
          )
        }),
      )
    }),
  )

  router.post(
    '/resetBetGoal',
    ...roleCheck([{ resource: 'account', action: 'update_bet_goal' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, balanceType, reason } = req.body

      if (!isBalanceType(balanceType)) {
        throw new APIValidationError('api__invalid_param')
      }

      await resetBetGoal(userId, balanceType)

      addAdminNoteToUser(
        userId,
        adminUser,
        `<b>ACP Action:</b> ${adminUser.name} toggled user's ${balanceType} bet goal: ${reason}`,
      )
    }),
  )

  router.post(
    '/assignRoleToAccount',
    ...roleCheck([{ resource: 'account', action: 'update_role' }]),
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, role } = req.body
      if (!isLegacyUserRole(role) && !isCustomerRole(role)) {
        throw new APIValidationError('api__invalid_param', ['role'])
      }
      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('User Not found.')
      }
      const previousRole =
        !user.role || user.role.length === 0 ? 'Normal' : user.role
      const roleUpdatedTo = role === '' ? 'Normal' : role
      const auditData = {
        editorId: adminUser.id,
        subjectId: `${userId}`,
        notes: `${role || 'Normal'}`,
        databaseAction: 'edit',
        actionType: 'roleChange',
        meta: {
          previousRole,
          roleUpdatedTo,
        },
      } as const

      await createAuditRecord(auditData, async () => {
        await updateUser(userId, { role })
      })
    }),
  )

  router.post(
    '/assignProductToAccount',
    ...roleCheck([{ resource: 'account', action: 'update_product' }]),
    api.validatedApiCall(async req => {
      const { userId, product } = req.body
      if (!isProduct(product)) {
        throw new APIValidationError('api__invalid_param', ['product'])
      }
      await updateUser(userId, { product })
    }),
  )

  router.post(
    '/assignManagerToAccount',
    ...roleCheck([{ resource: 'account', action: 'update_manager' }]),
    api.validatedApiCall(async req => {
      const { userId, manager } = req.body
      if (manager !== '' && !isValidManagerInput(manager)) {
        throw new APIValidationError('api__invalid_param', ['manager'])
      }
      await updateUser(userId, { manager })
    }),
  )

  router.post(
    '/assignDepartmentToAccount',
    ...roleCheck([{ resource: 'account', action: 'update_dept' }]),
    api.validatedApiCall(async req => {
      const { userId, department } = req.body
      if (!isDepartment(department)) {
        throw new APIValidationError('api__invalid_param', ['department'])
      }
      await updateUser(userId, { department })
    }),
  )

  router.post(
    '/validate2FACode',
    ...roleCheck([{ resource: 'account', action: 'send_verify_email' }]),
    api.validatedApiCall(async req => {
      const { userId, code } = req.body
      if (!userId || !code) {
        throw new APIValidationError('Missing arguments.')
      }

      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('No such user.')
      }

      if (!code) {
        throw new APIValidationError('Must supply code from user.')
      }

      return { success: await verifyTempTokenForUser(user, code) }
    }),
  )

  router.post(
    '/send2FACode',
    ...roleCheck([{ resource: 'account', action: 'send_verify_email' }]),
    api.validatedApiCall(async req => {
      const { userId } = req.body
      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('api__missing_param', ['userId'])
      }

      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('No such user.')
      }

      const twoCode = await generateUserVerificationCode(user)
      await sendTwoFactorCode(user, user.email, twoCode, user.name)
    }),
  )

  router.get(
    '/changeSystemDisabledForUser',
    ...roleCheck([{ resource: 'account', action: 'update_transactions' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { systemName, bool, userId } = req.query
      const enabled = bool === 'true'

      const reason =
        typeof req.query.reason === 'string' && req.query.reason.length
          ? req.query.reason
          : undefined

      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('api__missing_param', ['userId'])
      }

      if (isValidSystemName(systemName)) {
        if (!isTogglableSystemName(systemName)) {
          throw new APIValidationError('api__missing_param', ['systemName'])
        }
      } else {
        throw new APIValidationError('api__missing_param', ['systemName'])
      }

      const auditMessage = `${adminUser.name} ${
        bool === 'true' ? 'disabled' : 'enabled'
      } ${systemName}.`

      addAdminNoteToUser(
        userId,
        adminUser,
        `<b>ACP Action:</b> ${auditMessage}`,
      )

      const auditData = {
        editorId: adminUser.id,
        subjectId: userId,
        notes: auditMessage,
        databaseAction: 'edit',
        actionType: 'userSystemToggled',
        reason,
      } as const

      await createAuditRecord(auditData, async () => {
        await changeSystemEnabledUser(userId, systemName, !enabled)
      })
    }),
  )

  router.post(
    '/deleteAccount',
    ...roleCheck([{ resource: 'account', action: 'delete' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId } = req.body
      const account = await getUserById(userId)
      if (!account) {
        throw new APIValidationError('No such user.')
      }
      await archiveAndDeleteAccount(account)
    }),
  )

  router.post(
    '/changeUsername',
    ...roleCheck([{ resource: 'account', action: 'update_name' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId, newUsername } = req.body

      /*
       * make sure the newUsername.toLowerCase() doesn't exist.
       * change name, nameLowercase
       */

      if (!newUsername || newUsername.length < 3) {
        throw new APIValidationError('Username must be more than 3 characters.')
      }

      if (!isUsernameValid(newUsername)) {
        throw new APIValidationError(
          'Username may only contain alpha-numerics.',
        )
      }

      const exists = await getUserByName(newUsername, true)
      if (exists && exists.id !== userId) {
        throw new APIValidationError('Username already taken.')
      }

      await updateUser(userId, {
        name: newUsername,
        nameLowercase: newUsername.toLowerCase(),
      })
    }),
  )

  router.post(
    '/changeEmail',
    ...roleCheck([{ resource: 'account', action: 'update_email' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      let { newEmail } = req.body
      const { userId } = req.body

      newEmail = newEmail.toLowerCase()

      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('No such user.')
      }
      // TODO this is apiUrl and returnUrl will be wrong for users using mirrors
      const apiUrl = getBackendUrlFromReq(req)
      const returnUrl = getFrontendUrlFromReferer()
      await emailChange({ user, email: newEmail, apiUrl, returnUrl })
    }),
  )

  router.post(
    '/setDailyWithdrawLimit',
    ...roleCheck([{ resource: 'account', action: 'update_withdrawal_limit' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, dailyWithdrawLimit, reason } = req.body
      if (dailyWithdrawLimit) {
        await updateUser(userId, { dailyWithdrawLimit })
      } else {
        await updateUser(userId, { dailyWithdrawLimit: false })
      }

      addAdminNoteToUser(
        userId,
        adminUser,
        `<b>ACP Action:</b> ${adminUser.name} set withdrawal limit to ${numeral(
          dailyWithdrawLimit,
        ).format('$0,0')}.
      </br>Reason: <span style="font-style: italic">${reason}</span>`,
      )
    }),
  )

  router.post(
    '/createHowieDeal',
    ...roleCheck([{ resource: 'account', action: 'update_howie_deal' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId, percent } = req.body
      await updateUser(userId, {
        howieDeal: { total: false, remaining: false, percent },
      })
    }),
  )

  router.post(
    '/endHowieDeal',
    ...roleCheck([{ resource: 'account', action: 'update_howie_deal' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId } = req.body
      await updateUser(userId, { howieDeal: false })
    }),
  )

  router.post(
    '/setCustomAffiliateCut',
    ...roleCheck([{ resource: 'account', action: 'update_affiliate_cut' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId, customAffiliateCut } = req.body
      if (!customAffiliateCut) {
        await updateUser(userId, { customAffiliateCut: false })
      } else {
        await updateUser(userId, { customAffiliateCut })
      }
    }),
  )

  router.post(
    '/remove2FA',
    ...roleCheck([{ resource: 'account', action: 'update_2fa' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId } = req.body
      await updateUser(userId, { twofactorEnabled: false })
    }),
  )

  router.post(
    '/toggleSponsor',
    ...roleCheck([{ resource: 'account', action: 'update_role' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, isSponsor } = req.body
      const auditData = {
        editorId: adminUser.id,
        subjectId: `${userId}`,
        notes: `${isSponsor}`,
        databaseAction: 'edit',
        actionType: 'sponsorChange',
      } as const

      return await createAuditRecord(auditData, async () => {
        await updateUser(userId, { isSponsor })
      })
    }),
  )

  router.post(
    '/toggleWhale',
    ...roleCheck([{ resource: 'account', action: 'update_role' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, isWhale } = req.body
      const auditData = {
        editorId: adminUser.id,
        subjectId: `${userId}`,
        notes: `${isWhale}`,
        databaseAction: 'edit',
        actionType: 'sponsorChange',
      } as const

      return await createAuditRecord(auditData, async () => {
        await updateUser(userId, { isWhale })
      })
    }),
  )

  router.post(
    '/toggleMarketing',
    ...roleCheck([{ resource: 'account', action: 'update_role' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, isMarketing } = req.body
      const auditData = {
        editorId: adminUser.id,
        subjectId: `${userId}`,
        notes: `${isMarketing}`,
        databaseAction: 'edit',
        actionType: 'marketingChange',
      } as const

      return await createAuditRecord(auditData, async () => {
        await updateUser(userId, { isMarketing })
      })
    }),
  )

  router.post(
    '/toggleChatModBadge',
    ...roleCheck([{ resource: 'account', action: 'update_chat' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, hasChatModBadge } = req.body

      if (typeof hasChatModBadge !== 'boolean') {
        throw new APIValidationError('hasChatModBadge is invalid')
      }

      const auditData = {
        editorId: adminUser.id,
        subjectId: `${userId}`,
        notes: `hasChatModBadge: ${hasChatModBadge}`,
        databaseAction: 'edit',
        actionType: 'chatBadgeChange',
      } as const

      return await createAuditRecord(auditData, async () => {
        await updateUser(userId, { hasChatModBadge })
      })
    }),
  )

  router.post(
    '/toggleChatModSetting',
    ...roleCheck([{ resource: 'account', action: 'update_chat' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId, isChatMod } = req.body
      try {
        await updateUser(userId, { isChatMod })
      } catch (err) {
        throw new APIValidationError(err.message)
      }
    }),
  )

  router.post(
    '/toggleChatDevBadge',
    ...roleCheck([{ resource: 'account', action: 'update_chat' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, hasChatDevBadge } = req.body

      if (typeof hasChatDevBadge !== 'boolean') {
        throw new APIValidationError('hasChatDevBadge is invalid')
      }

      const auditData = {
        editorId: adminUser.id,
        subjectId: `${userId}`,
        notes: `hasChatDevBadge: ${hasChatDevBadge}`,
        databaseAction: 'edit',
        actionType: 'chatBadgeChange',
      } as const

      return await createAuditRecord(auditData, async () => {
        await updateUser(userId, { hasChatDevBadge })
      })
    }),
  )

  router.post(
    '/toggleStaff',
    ...roleCheck([{ resource: 'account', action: 'update_permissions' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId, staff } = req.body
      await updateUser(userId, { staff: !!staff })
    }),
  )

  router.post(
    '/toggleRoowards',
    ...roleCheck([{ resource: 'roowards', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, roowardsDisabled } = req.body
      await updateUser(userId, { roowardsDisabled })

      addAdminNoteToUser(
        userId,
        adminUser,
        `<b>ACP Action:</b> ${adminUser.name} ${
          roowardsDisabled ? 'disabled' : 'enabled'
        } roowards.`,
      )
    }),
  )

  router.post(
    '/resetLoginAttempts',
    ...roleCheck([{ resource: 'account', action: 'update_login_attempts' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId } = req.body
      await updateUser(userId, { invalidLoginAttempts: 0 })
    }),
  )

  router.post(
    '/logoutUserFromAllSessions',
    ...roleCheck([{ resource: 'account', action: 'logout' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId } = req.body
      const sessions = await getUserSessionsByUser(userId)
        .where('destroyed', false)
        .select('sessionId')
      for (const session of sessions) {
        sessionStore.destroy(session.sessionId)
      }
      io.to(userId).emit('forceRefresh')
    }),
  )

  router.post(
    '/updateConsent',
    ...roleCheck([{ resource: 'crm', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId, updatePayload } = req.body
      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('api__missing_param', ['userId'])
      }
      Object.keys(updatePayload).forEach(field => {
        if (!isConsentType(field)) {
          throw new APIValidationError('api__invalid_param', ['updatePayload'])
        }
      })
      await updateConsentForUserId(userId, updatePayload)
      publishUserConsentMessageToFastTrack(userId)
    }),
  )

  // just an experiment will move later
  const BalanceTypesV = t.keyof({
    crypto: null,
    ltc: null,
    eth: null,
    doge: null,
    xrp: null,
    usdt: null,
    usdc: null,
  })

  const capabilitiesParamsV = t.intersection([
    t.type({
      userId: UserIdT,
      identifier: t.string,
      gameName: t.string,
    }),
    t.partial({ balanceTypeOverride: BalanceTypesV }),
  ])

  router.get(
    '/capabilities',
    ...roleCheck([{ resource: 'account', action: 'read' }]),
    api.validatedApiCall(async req => {
      if (!capabilitiesParamsV.is(req.query)) {
        throw new APIValidationError('api__invalid_param')
      }

      const { identifier, userId, balanceTypeOverride, gameName } = req.query
      const game = await getGame({ identifier })
      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('user__does_not_exist')
      }

      return await checkCanPlaceBetOnGame(
        user,
        gameName,
        game,
        balanceTypeOverride ?? null,
      )
    }),
  )

  return router
}
