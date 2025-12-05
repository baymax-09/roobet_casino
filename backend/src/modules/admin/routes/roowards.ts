import { Router } from 'express'
import moment from 'moment'

import { APIValidationError } from 'src/util/errors'
import {
  setUserRoowardLevel,
  updateUser,
  User,
  type Types as UserTypes,
} from 'src/modules/user'
import { mongoose, r } from 'src/system'
import { recordStat } from 'src/modules/stats'
import {
  removeReload,
  getReloadHistory,
  countReloads,
  updateRoowardsReloadForUser,
} from 'src/modules/roowards/documents/RoowardsReload'
import { isValidRoowardsTimespan } from 'src/modules/roowards'
import { api, type RoobetReq } from 'src/util/api'
import { isBalanceType } from 'src/modules/user/balance'

import { logAdminAction, roleCheck } from '../middleware'

export function createRoowardsRouter() {
  const router = Router()

  router.post(
    '/setRoowardsLevel',
    ...roleCheck([{ resource: 'roowards', action: 'update' }]),
    api.validatedApiCall(async req => {
      const { level, type, userId } = (() => {
        const { level, type, userId } = req.body
        return {
          userId,
          type,
          level: level ? Number.parseInt(level) : undefined,
        }
      })()

      if (!userId) {
        throw new APIValidationError('Missing userId.')
      }
      if (!level) {
        throw new APIValidationError('Missing Rooward level.')
      }
      if (!type) {
        throw new APIValidationError('Missing Rooward type.')
      }

      // Basic validator, could also upgrade the uuid package to 8.3.0 for their "validate" function
      if (!userId.match(/([0-9a-f]+-)+/g)) {
        throw new APIValidationError('Invalid userId. Expected a v4 uuid.')
      }
      if (!Number.isInteger(level) || level < 0 || level > 10) {
        throw new APIValidationError(
          'Invalid level. Expected a positive integer between 0 and 10.',
        )
      }
      if (!isValidRoowardsTimespan(type)) {
        throw new APIValidationError('Invalid type. Expected "d", "w", or "m".')
      }

      await setUserRoowardLevel({ level, type, userId })

      return {
        success: true,
      }
    }),
  )

  router.post(
    '/reloads',
    ...roleCheck([{ resource: 'roowards_recharge', action: 'read' }]),
    api.validatedApiCall(async req => {
      const { sort, filter } = req.body

      const limit = 25
      const page = 0

      const query = () => getReloadHistory(filter, sort)

      const reloads = await query()
        .limit(limit)
        .skip(page * limit)
        .lean()

      const userIds = Array.from(new Set(reloads.map(reload => reload.userId)))
      // TODO TS pluck is parameterized by <any> so usersExists is any, fix Rethinkdbdash types
      // @ts-expect-error getAll doesn't accept rest args in the declarations but should
      const users: UserTypes.DBUser[] = await User.getAll(...userIds)
        .pluck('id', 'name')
        .run()

      const userMap = users.reduce<Record<string, UserTypes.DBUser>>(
        (userMap, user) => ({ ...userMap, [user.id]: user }),
        {},
      )

      return {
        page,
        limit,

        count: await query().countDocuments(),
        reloads: reloads.map(reload => ({
          ...reload,
          user: userMap[reload.userId] || null,
          lastClaimed: moment(reload.lastClaimedAt).fromNow(),
          expired:
            reload.totalClaims >= reload.maxClaims ||
            Date.now() > reload.expiresAt.getTime(),
        })),
      }
    }),
  )

  router.post(
    '/disableReload',
    ...roleCheck([{ resource: 'roowards_recharge', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { id } = req.body

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIValidationError('Invalid id')
      }

      const exists = await countReloads(id)

      if (exists <= 0) {
        throw new APIValidationError('Cannot find Rooward Recharge')
      }

      await removeReload(id)

      return {
        success: true,
      }
    }),
  )

  router.post(
    '/enableReload',
    ...roleCheck([{ resource: 'roowards_recharge', action: 'update' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userName, currency, amount, maxClaims } = req.body
      const { user: adminUser } = req as RoobetReq
      // Right now this is just hardcoded to 'balance' in ACP FE right now
      if (!isBalanceType(currency)) {
        throw new APIValidationError('api__invalid_param', ['currency'])
      }
      const interval = 43200

      if (typeof userName !== 'string' || !userName.length) {
        throw new APIValidationError('Invalid user name')
        /*
         * } else if (typeof interval !== 'number') {
         * throw new APIValidationError('Invalid interval')
         */
      }
      if (typeof amount !== 'number' || amount <= 0) {
        throw new APIValidationError('Invalid amount')
      }
      if (typeof maxClaims !== 'number' || maxClaims <= 0) {
        throw new APIValidationError('Invalid Maximum Claims')
      }

      // Minimum interval set to an hour, you never know
      if (interval < 3600) {
        throw new APIValidationError('The minimum claim interval is an hour')
      }

      const now = moment()
      const mExpiresAt = moment().add(maxClaims + 1, 'd')

      if (mExpiresAt.isBefore(now)) {
        throw new APIValidationError('Expiration date must be in the future')
      } else if (mExpiresAt.isBefore(now.add(interval, 'seconds'))) {
        throw new APIValidationError(
          'Expiration date is too soon to be claimable',
        )
      }

      // TODO TS pluck is parameterized by <any> so usersExists is any, fix Rethinkdbdash types
      const userExists = await User.getAll(userName.toLowerCase(), {
        index: 'nameLowercase',
      })
        .pluck('id')
        .run()

      if (!userExists.length) {
        throw new APIValidationError('User does not exist')
      }

      const totalValue = amount * maxClaims
      await updateUser(userExists[0].id, {
        rechargeGiven: r
          .row('rechargeGiven')
          .add(totalValue)
          .default(totalValue),
      })
      recordStat(
        userExists[0],
        { key: 'rechargeGiven', amount: totalValue },
        true,
      )

      const reload = await updateRoowardsReloadForUser(userExists[0].id, {
        interval,
        amount,
        maxClaims,
        lastClaimedAt: null,
        totalClaims: 0,
        expiresAt: mExpiresAt.toDate(),
        createdAt: new Date(),
        currency,
        issuerId: adminUser.id ?? '',
      })

      return {
        reload,
        success: true,
      }
    }),
  )

  return router
}
