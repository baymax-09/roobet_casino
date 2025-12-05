import { Router } from 'express'
import shortid from 'shortid'

import { api } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { getGame, updateGame } from 'src/modules/tp-games/documents/games'
import { media } from 'src/util/media'
import { type TPGame } from 'src/modules/tp-games/documents/games'

import { roleCheck } from '../middleware'

export function createTPGamesRouter() {
  const router = Router()

  router.post(
    '/bulkUpdate',
    api.check,
    ...roleCheck([{ resource: 'tpgames', action: 'update_bulk' }]),
    api.validatedApiCall(async req => {
      const data: Array<Record<string, any>> | undefined = req.body.data

      if (!data || data.length === 0) {
        throw new APIValidationError('Error: No data given.')
      }

      const rows: Array<
        ({ id: string; game: TPGame } & Partial<TPGame>) | { error: string }
      > = []

      // Validate all rows are valid, upload files to S3.
      for (const row of data) {
        const index = data.indexOf(row)

        if (!row.id) {
          rows.push({
            error: `Error (row ${index + 1}): Game identified not supplied.`,
          })
          continue
        }

        const game = await getGame({ identifier: row.id })

        if (!game) {
          rows.push({
            error: `Error (row ${index + 1}): Failed to lookup game with id ${
              row.id
            }.`,
          })
          continue
        }

        if (
          row.squareImage &&
          (!row.squareImage.filename || !row.squareImage.data)
        ) {
          rows.push({
            error: `Error (row ${index + 1}): Square image invalid. ${
              row.squareImage?.error || ''
            }`,
          })
          continue
        }

        const squareImage = await (async () => {
          if (!row.squareImage) {
            return undefined
          }

          // Upload image to S3.
          const dest = 'publicImages'
          const ext = row.squareImage.filename.split('.').pop()
          const path = `${row.id}-${shortid.generate()}.${ext}`
          const contents = Buffer.from(row.squareImage.data, 'base64')

          await media.upload({
            dest,
            path,
            contents,
          })

          return media.getPublicUrl({ dest, path })
        })()

        rows.push({
          ...row,
          game,
          id: row.id,
          squareImage,
        })
      }

      // Write updates concurrently and return result.
      const responses = await Promise.all(
        rows.map(async row => {
          if ('error' in row) {
            return row
          }

          const { id, ...game } = row

          const updatedGame = await updateGame(
            { identifier: id },
            {
              ...game,
            },
          )

          if (!updatedGame) {
            return { error: 'No such game' }
          }

          return {
            updatedGame,
          }
        }),
      )

      return { responses, errors: [], successes: [] }
    }),
  )
  return router
}
