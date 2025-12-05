import { Router } from 'express'

import { api, type RoobetReq } from 'src/util/api'

import { logAdminAction, roleCheck } from '../middleware'
import { APIValidationError } from 'src/util/errors'
import {
  addNoteToUser,
  updateNote,
  deleteNote,
  findNotesForUser,
  isUserNoteType,
} from '../documents/user_notes'
import { getUserByIdOrName } from 'src/modules/user'

import { type User } from 'src/modules/user/types'

export function createNotesRouter() {
  const router = Router()

  router.get(
    '/userNotes',
    ...roleCheck([{ resource: 'user_notes', action: 'read' }]),
    api.validatedApiCall(async req => {
      const { userId, department, type } = req.query

      if (typeof userId !== 'string') {
        throw new APIValidationError('api__invalid_param', ['userId'])
      }
      // department and type are optional but must be strings if included
      if (department && typeof department !== 'string') {
        throw new APIValidationError('api__invalid_param', ['department'])
      }
      if (isUserNoteType(type) || type === undefined) {
        return await findNotesForUser(userId, department, type)
      } else {
        throw new APIValidationError('api__invalid_param', ['type'])
      }
    }),
  )

  router.post(
    '/userNote',
    ...roleCheck([{ resource: 'user_notes', action: 'create' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { noteId, userId, note } = req.body
      const { user } = req as RoobetReq
      if (noteId) {
        return await updateNote(noteId, user, note)
      } else {
        return await addNoteToUser(userId, user, note)
      }
    }),
  )

  router.post(
    '/deleteUserNote',
    ...roleCheck([{ resource: 'user_notes', action: 'delete' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { noteId } = req.body
      return await deleteNote(noteId)
    }),
  )

  router.post(
    '/addNoteBulk',
    api.check,
    ...roleCheck([{ resource: 'user_notes', action: 'create_bulk' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { data } = req.body
      const adminUser = req.user as User

      if (!data || data.length === 0) {
        throw new APIValidationError('Error: No data given.')
      }

      // Validate all of these accounts exist.. throw an error if 1 does not exist.
      const rows = await Promise.all(
        (data as Array<Record<string, any>>).map(async (row, index) => {
          if (!row.note) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Note is missing.`,
            )
          }

          if (!row.userId && !row.username) {
            throw new APIValidationError(
              `Error (row ${
                index + 1
              }): Either userId or username must be supplied.`,
            )
          }

          const idOrName = row.userId.trim() || row.username.trim()

          const user = await getUserByIdOrName(
            row.userId?.trim(),
            row.username?.trim(),
            true,
          )

          if (!user) {
            throw new APIValidationError(
              `Error (row ${index + 1}): User ${idOrName} does not exist.`,
            )
          }

          return { user, data: row }
        }),
      )

      // Write notes concurrently.
      await Promise.allSettled(
        rows.map(
          async row =>
            await addNoteToUser(row.user.id, adminUser, row.data.note),
        ),
      )
    }),
  )

  return router
}
