import { Router } from 'express'

import { api, type RoobetReq } from 'src/util/api'
import { logAdminAction, roleCheck } from 'src/modules/admin/middleware'
import { getUserByIdOrName } from 'src/modules/user/documents/user'

import {
  getActiveBonusTemplates,
  issueBonus,
  revokeBonus,
} from '../lib/bonuses'
import { APIValidationError } from 'src/util/errors'

const parseErrorMessage = (error: any, fallback: string): string => {
  return (
    error.response?.data?.errors?.[0] ??
    error.response?.data?.message ??
    fallback
  )
}

export const createAdminRouter = () => {
  const router = Router()

  router.get(
    '/bonus-templates',
    ...roleCheck([{ resource: 'freespins', action: 'read' }]),
    api.validatedApiCall(async () => {
      const templates = await getActiveBonusTemplates()

      return { templates }
    }),
  )

  router.post(
    '/bonus',
    ...roleCheck([{ resource: 'freespins', action: 'create' }]),
    api.validatedApiCall(async req => {
      const { userId, amount, bonusTemplateId, reason } = req.body
      const { user: adminUser } = req as RoobetReq

      try {
        const bonuses = await issueBonus({
          userId,
          bonusTemplateId,
          amount,
          issuerId: adminUser.id,
          reason,
        })
        return { bonuses }
      } catch (error) {
        const message = parseErrorMessage(error, 'Failed to issue bonus.')

        throw new APIValidationError(message)
      }
    }),
  )

  router.post(
    '/createBonusBulk',
    ...roleCheck([{ resource: 'freespins', action: 'create_bulk' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { data, reason } = req.body
      const { user: adminUser } = req as RoobetReq

      if (!data || data.length === 0) {
        throw new APIValidationError('Error: No data given.')
      }

      // validate fields
      const rows = await Promise.all(
        (data as Array<Record<string, any>>).map(async (row, index) => {
          row.reason = reason
          if (!row.bonusTemplateId) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing templateId.`,
            )
          }

          if (!row.amount) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing amount.`,
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
            throw new APIValidationError('Missing Reason.')
          }

          return { user, data: row }
        }),
      )

      // write bonuses concurrently.
      const results = await Promise.all(
        rows.map(async row => {
          const { bonusTemplateId, amount, reason } = row.data
          const userId = row.user.id

          try {
            await issueBonus({
              userId,
              bonusTemplateId: Number(bonusTemplateId),
              amount: Number(amount),
              issuerId: adminUser.id,
              reason,
            })

            return {
              userId,
              bonusTemplateId,
              amount,
              created: true,
            }
          } catch (err) {
            return {
              userId,
              bonusTemplateId,
              amount,
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

  router.delete(
    '/bonus/:id',
    ...roleCheck([{ resource: 'freespins', action: 'delete' }]),
    api.validatedApiCall(async req => {
      const { id } = req.params

      if (typeof id !== 'string') {
        throw new APIValidationError('api__missing_param', ['bonus id'])
      }

      try {
        await revokeBonus({ bonusId: id })

        return { success: true }
      } catch (error) {
        const message = parseErrorMessage(error, 'Failed to revoke bonus.')

        throw new APIValidationError(message)
      }
    }),
  )

  return router
}
