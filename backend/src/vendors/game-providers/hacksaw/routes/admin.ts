import { Router } from 'express'

import { api, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { logAdminAction, roleCheck } from 'src/modules/admin/middleware'
import { getUserByIdOrName } from 'src/modules/user/documents/user'
import { addAdminNoteToUser } from 'src/modules/admin'

import { issueBonus, revokeBonus } from '../lib'
import { hacksawLogger } from '../lib/logger'

export function createAdminRouter() {
  const router = Router()

  router.post(
    '/bonus',
    ...roleCheck([{ resource: 'freespins', action: 'create' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId, amount, gameId, rounds, expiresAt, reason } = req.body
      const { user: adminUser } = req as RoobetReq

      try {
        await issueBonus({
          userId,
          amount,
          gameId,
          rounds,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          issuerId: adminUser.id,
          reason,
        })
        addAdminNoteToUser(
          userId,
          adminUser,
          `<b>ACP Action:</b> ${adminUser.name} issued ${rounds} rounds of Hacksaw Freespins for hacksaw:${gameId}, with an amount of ${amount}`,
        )
        return { bonus: undefined }
      } catch (error) {
        throw new APIValidationError('Failed to add bonus')
      }
    }),
  )

  router.post(
    '/createFreespinsBulk',
    ...roleCheck([{ resource: 'freespins', action: 'create_bulk' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { data, reason } = req.body
      const { user: adminUser } = req as RoobetReq

      if (!data || data.length === 0) {
        throw new APIValidationError('Error: No data given.')
      }

      // Validate all of these accounts exist.. throw an error if 1 does not exist.
      const rows = await Promise.all(
        (data as Array<Record<string, any>>).map(async (row, index) => {
          row.reason = reason
          if (!row.rounds) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing rounds.`,
            )
          }

          if (!row.gameId) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing gameId.`,
            )
          }

          if (!row.amount) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing amount.`,
            )
          }

          if (!row.expirationDate) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing expirationDate.`,
            )
          }

          if (!row.userId && !row.username) {
            throw new APIValidationError(
              `Error (row ${
                index + 1
              }): Either userId or username must be supplied.`,
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

          if (!row.reason) {
            throw new APIValidationError('Missing reason.')
          }

          return { user, data: row }
        }),
      )

      // Write freespins concurrently.
      const results = await Promise.all(
        rows.map(async row => {
          const { rounds, gameId, amount, expirationDate, reason } = row.data
          const userId = row.user.id

          try {
            await issueBonus({
              userId,
              amount,
              gameId,
              rounds,
              expiresAt: expirationDate ? new Date(expirationDate) : undefined,
              reason,
              issuerId: adminUser.id,
            })

            return {
              userId,
              rounds,
              gameId,
              amount,
              expirationDate,
              created: true,
            }
          } catch (err) {
            hacksawLogger('/createFreespinsBulk', {
              userId: adminUser.id,
            }).info(
              'Failed to issue bonus for hacksaw game in bulk upload',
              { gameId },
              err,
            )
            return {
              userId,
              rounds,
              gameId,
              amount,
              expirationDate,
              created: false,
            }
          }
        }),
      )

      return {
        responses: results,
        errors: [],
        successes: [],
      }
    }),
  )

  router.post(
    '/deleteBonus',
    ...roleCheck([{ resource: 'freespins', action: 'delete' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId, externalOfferId } = req.body

      if (typeof externalOfferId !== 'string') {
        throw new APIValidationError('api__missing_param', ['externalOfferId'])
      }
      if (typeof userId !== 'string') {
        throw new APIValidationError('api__missing_param', ['userId'])
      }

      try {
        await revokeBonus({ userId, externalOfferId })

        return { success: true }
      } catch (error) {
        throw new APIValidationError('Failed to revoke bonus')
      }
    }),
  )

  return router
}
