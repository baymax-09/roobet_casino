import express from 'express'
import json2csv from 'json2csv'

import { api, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { Middleware as adminMidWare } from 'src/modules/admin'
import { getUserById, getUserByName, getUserByIdOrName } from 'src/modules/user'
import { isBalanceType } from 'src/modules/user/balance'

import {
  getAllByCode,
  createPromoCode,
  getAllPromoCodes,
  updatePromoCode,
  deletePromoCode,
} from 'src/modules/promo/documents/promo_code'
import {
  createMatchPromo,
  abortMatchPromoNoPenalty,
  abortMatchPromoWithPenalty,
} from '../documents/match_promo'
import { promoLogger } from '../lib/logger'

export default function () {
  const router = express.Router()

  router.put(
    '/',
    api.check,
    ...adminMidWare.roleCheck([{ resource: 'promos', action: 'create' }]),
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const {
        claimAmount,
        roowardsBonus,
        claimsRemaining,
        expireTime,
        code,
        balanceType,
        mustBeAffiliated,
        hasNotDeposited,
        depositCount,
        depositLimit,
        wagerLimit,
        cxAffId,
      } = req.body
      let { affiliateName } = req.body

      const userWithName = await getUserByName(code, true)
      if (userWithName) {
        throw new APIValidationError('There is a user with this name.')
      }

      if (!affiliateName || (affiliateName && affiliateName.length === 0)) {
        affiliateName = false
      }

      if (affiliateName) {
        const affiliateNameExists = await getUserByName(affiliateName, true)
        if (!affiliateNameExists) {
          throw new APIValidationError("Affiliate doesn't exist.")
        }
      }

      if (affiliateName && cxAffId) {
        throw new APIValidationError(
          'Promo code cannot have both an affiliateName and cxAffId',
        )
      }

      if (!roowardsBonus && !isBalanceType(balanceType)) {
        throw new APIValidationError('api__invalid_param', [
          'roowardsBonus/balanceType',
        ])
      }

      await createPromoCode(
        user.id,
        claimAmount,
        roowardsBonus,
        claimsRemaining,
        expireTime,
        code,
        roowardsBonus ? null : balanceType,
        {
          hasNotDeposited,
          depositCount,
          depositLimit,
          wagerLimit,
          affiliateName,
          mustBeAffiliated,
          cxAffId,
        },
      )
      const [promoCode] = await getAllByCode(code)
      return promoCode
    }),
  )

  router.post(
    '/addCodesBulk',
    api.check,
    ...adminMidWare.roleCheck([{ resource: 'promos', action: 'create_bulk' }]),
    api.validatedApiCall(async req => {
      const { data } = req.body
      if (!data || data.length === 0) {
        throw new APIValidationError('Error. No data given.')
      }
      const { user } = req as RoobetReq
      const errors = []
      const successes = []
      for (const promo of data) {
        let {
          claimAmount,
          roowardsBonus,
          claimsRemaining,
          expireTime,
          code,
          hasNotDeposited,
          depositCountHours,
          depositCountAmount,
          depositLimitHours,
          depositLimitAmount,
          wagerLimitHours,
          wagerLimitAmount,
          mustBeAffiliated,
          affiliateName,
          cxAffId,
        } = promo

        const { balanceType } = promo

        const expireTimeInt = expireTime ? parseInt(expireTime) : 0
        const lowercaseCode = code.toLowerCase()

        // User may be trying to expire the promo code, if already in db
        if (expireTimeInt === 0) {
          // TODO: Are we allowing multiple promos with the same code? if so, why?
          const promos = await getAllByCode(lowercaseCode)
          if (promos.length > 0) {
            for (const promo of promos) {
              await updatePromoCode({
                id: promo.id,
                expireTimeUpdate: expireTime,
              })
            }
          }
          continue
        }

        hasNotDeposited = hasNotDeposited.toLowerCase() == 'true'
        mustBeAffiliated = mustBeAffiliated.toLowerCase() == 'true'
        roowardsBonus = roowardsBonus.toLowerCase() == 'true'
        claimAmount =
          claimAmount && !roowardsBonus ? parseFloat(claimAmount) : 0
        claimsRemaining = claimsRemaining ? parseInt(claimsRemaining) : 0
        expireTime = expireTimeInt
        depositCountAmount = depositCountAmount
          ? parseInt(depositCountAmount)
          : null
        depositCountHours = depositCountHours
          ? parseInt(depositCountHours)
          : null
        depositLimitHours = depositLimitHours
          ? parseInt(depositLimitHours)
          : null
        depositLimitAmount = depositLimitAmount
          ? parseInt(depositLimitAmount)
          : null
        wagerLimitHours = wagerLimitHours ? parseInt(wagerLimitHours) : null
        wagerLimitAmount = wagerLimitAmount ? parseInt(wagerLimitAmount) : null
        code = lowercaseCode

        const depositLimit =
          depositLimitHours && depositLimitAmount
            ? { hours: depositLimitHours, amount: depositLimitAmount }
            : false

        const wagerLimit =
          wagerLimitHours && wagerLimitAmount
            ? { hours: wagerLimitHours, amount: wagerLimitAmount }
            : false

        const depositCount =
          depositCountHours && depositCountAmount
            ? { hours: depositCountHours, amount: depositCountAmount }
            : false

        try {
          const userWithName = await getUserByName(code, true)
          if (userWithName) {
            errors.push({
              error: 'There is a user with this name.',
              data: promo,
            })
            continue
          }
          if (!affiliateName || (affiliateName && affiliateName.length === 0)) {
            affiliateName = false
          }
          if (affiliateName) {
            const affiliateNameExists = await getUserByName(affiliateName, true)
            if (!affiliateNameExists) {
              errors.push({ error: "Affiliate doesn't exist.", data: promo })
              continue
            }
          }
          if (affiliateName && cxAffId) {
            throw new APIValidationError(
              'Promo code cannot have both an affiliateName and cxAffId',
            )
          }
          if (!roowardsBonus && !isBalanceType(balanceType)) {
            errors.push({
              error: 'Must be Roowards Bonus or have a balance type.',
              data: promo,
            })
            continue
          }

          await createPromoCode(
            user.id,
            claimAmount,
            roowardsBonus,
            claimsRemaining,
            expireTime,
            code,
            roowardsBonus ? null : balanceType,
            {
              hasNotDeposited,
              depositCount,
              depositLimit,
              wagerLimit,
              affiliateName,
              mustBeAffiliated,
              cxAffId,
            },
          )
          const [promoCode] = await getAllByCode(code)
          successes.push({ promo: promoCode })
        } catch (error) {
          promoLogger('/addCodesBulk', { userId: user.id }).error(
            'createPromoCode error',
            error,
          )
          errors.push({ error: error.toString(), data: promo })
        }
      }

      return { errors, successes }
    }),
  )

  router.post(
    '/addMatchPromoBulk',
    api.check,
    ...adminMidWare.roleCheck([
      { resource: 'deposit_bonus', action: 'create_bulk' },
    ]),
    api.validatedApiCall(async req => {
      const { data } = req.body
      const { user: adminUser } = req as RoobetReq

      if (!data || data.length === 0) {
        throw new APIValidationError('Error. No data given.')
      }

      // Validate all of these accounts exist, collect errors.
      const rows = await Promise.all(
        (data as Array<Record<string, any>>).map(async (row, index) => {
          if (!row.userId && !row.username) {
            return {
              error: `Error (row ${
                index + 1
              }): Either userId or username must be supplied.`,
            }
          }

          const user = await getUserByIdOrName(
            row.userId?.trim(),
            row.username?.trim(),
            true,
          )

          if (!user) {
            const idOrName = row.userId || row.username

            return {
              error: `Error (row ${
                index + 1
              }): User ${idOrName} does not exist.`,
              userId: idOrName,
            }
          }

          return { user, data: row }
        }),
      )

      // Write match promos concurrently.
      const responses = await Promise.all(
        rows.map(async row => {
          if (!row.data || row.error) {
            return row
          }

          const {
            maxMatch,
            percentMatch,
            wagerRequirementMultiplier,
            bonusType,
            fixedAmount,
            expirationDate,
            reason,
            minDeposit,
          } = row.data
          const override = row.data.override.toLowerCase() === 'true'

          try {
            const matchPromo = await createMatchPromo(
              row.user.id,
              bonusType,
              reason,
              adminUser.id,
              fixedAmount,
              maxMatch,
              percentMatch,
              wagerRequirementMultiplier,
              minDeposit,
              expirationDate,
              override,
            )

            return { ...matchPromo.toObject() }
          } catch (error) {
            promoLogger('/addMatchPromoBulk', { userId: row.user.id }).error(
              'createPromoCode error',
              error,
            )
            return {
              error:
                error instanceof Error ? error.toString() : 'Unknown error.',
              userId: row.user.id,
            }
          }
        }),
      )

      return { responses, errors: [], successes: [] }
    }),
  )

  router.put(
    '/matchPromo',
    api.check,
    ...adminMidWare.roleCheck([
      { resource: 'deposit_bonus', action: 'create' },
    ]),
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      return await createMatchPromo(
        req.body.userId,
        req.body.bonusType,
        req.body.reason,
        adminUser.id,
        req.body.fixedAmount,
        req.body.maxMatch,
        req.body.percentMatch,
        req.body.wagerRequirementMultiplier,
        req.body.minDeposit,
        req.body.expirationDate,
        req.body.override,
      )
    }),
  )

  router.post(
    '/abortMatchPromoNoPenalty',
    api.check,
    ...adminMidWare.roleCheck([
      { resource: 'deposit_bonus', action: 'update' },
    ]),
    api.validatedApiCall(async req => {
      await abortMatchPromoNoPenalty(req.body.userId)
    }),
  )

  router.post(
    '/abortMatchPromoWithPenalty',
    api.check,
    ...adminMidWare.roleCheck([
      { resource: 'deposit_bonus', action: 'update' },
    ]),
    api.validatedApiCall(async req => {
      await abortMatchPromoWithPenalty(req.body.userId)
    }),
  )

  router.get(
    '/',
    api.check,
    ...adminMidWare.roleCheck([{ resource: 'promos', action: 'read' }]),
    api.validatedApiCall(async () => {
      const promotions = await getAllPromoCodes()
      return promotions
    }),
  )

  router.get(
    '/getUsersWhoClaimedCode',
    api.check,
    ...adminMidWare.roleCheck([{ resource: 'promos', action: 'read' }]),
    api.validatedApiCall(async (req, res) => {
      const { code } = req.query

      if (!code) {
        throw new APIValidationError('api__missing_param', ['code'])
      }

      if (typeof code !== 'string') {
        throw new APIValidationError('api__invalid_param', ['code'])
      }

      const [promoCode] = await getAllByCode(code)
      if (!promoCode) {
        throw new APIValidationError('promo__non_exists')
      }

      const users = []
      const fields: string[] = []
      for (const userId of Object.keys(promoCode.claimedUserIds)) {
        const user = await getUserById(userId)
        if (user) {
          users.push(user)
          for (const field of Object.keys(user)) {
            if (!fields.includes(field)) {
              // add field..
              fields.push(field)
            }
          }
        }
      }

      const data = json2csv({ data: users, fields })

      res.attachment(`${code}.csv`)
      res.status(200).send(data)
    }),
  )

  router.patch(
    '/:id',
    api.check,
    ...adminMidWare.roleCheck([{ resource: 'promos', action: 'update' }]),
    api.validatedApiCall(async req => {
      const { id } = req.params
      const { claimAmountUpdate, claimsRemainingUpdate, expireTimeUpdate } =
        req.body
      return await updatePromoCode({
        id,
        claimAmountUpdate,
        claimsRemainingUpdate,
        expireTimeUpdate,
      })
    }),
  )

  router.delete(
    '/:id',
    api.check,
    ...adminMidWare.roleCheck([{ resource: 'promos', action: 'delete' }]),
    api.validatedApiCall(async req => {
      const { id } = req.params
      await deletePromoCode(id)
    }),
  )

  return router
}
