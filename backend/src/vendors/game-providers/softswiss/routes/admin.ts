import type express from 'express'
import moment from 'moment'

import { api, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { logAdminAction, roleCheck } from 'src/modules/admin/middleware'
import { getUserByIdOrName } from 'src/modules/user/documents/user'
import { addAdminNoteToUser } from 'src/modules/admin'

import * as softswissAPI from '../lib/api'

export default function (router: express.Router) {
  router.post(
    '/createFreespins',
    api.check,
    ...roleCheck([{ resource: 'freespins', action: 'create' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { userId, gameId, rounds, betLevel, reason } = req.body
      const { user: adminUser } = req as RoobetReq

      if (!userId || !gameId || !rounds || !betLevel) {
        throw new APIValidationError('Missing fields.')
      }
      await softswissAPI.issueFreespins(
        userId,
        gameId,
        parseInt(rounds),
        parseInt(betLevel),
        undefined,
        adminUser.id,
        reason,
      )
      addAdminNoteToUser(
        userId,
        adminUser,
        `<b>ACP Action:</b> ${adminUser.name} issued ${rounds} rounds time of Softswiss Freespins for ${gameId}, with a betLevel of ${betLevel}`,
      )
    }),
  )

  router.post(
    '/cancelFreespins',
    api.check,
    ...roleCheck([{ resource: 'freespins', action: 'delete' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { issue_id } = req.body
      if (!issue_id) {
        throw new APIValidationError('Missing issue_id.')
      }
      await softswissAPI.cancelFreespins(issue_id)
    }),
  )

  router.post(
    '/createFreespinsBulk',
    api.check,
    ...roleCheck([{ resource: 'freespins', action: 'create_bulk' }]),
    logAdminAction,
    api.validatedApiCall(async (req, res) => {
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

          if (!row.betLevel) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing betLevel.`,
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
          const { rounds, gameId, betLevel, expirationDate, reason } = row.data
          const userId = row.user.id

          try {
            await softswissAPI.issueFreespins(
              userId,
              gameId,
              parseInt(rounds),
              parseInt(betLevel),
              moment(expirationDate).toISOString(),
              adminUser.id,
              reason,
            )

            return {
              userId,
              rounds,
              gameId,
              betLevel,
              expirationDate,
              created: true,
            }
          } catch (err) {
            return {
              userId,
              rounds,
              gameId,
              betLevel,
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
}
