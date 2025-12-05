import { Router } from 'express'
import { logAdminAction, roleCheck } from 'src/modules/admin/middleware'
import { getGame } from 'src/modules/tp-games/documents/games'
import { type RoobetReq, api } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import {
  type CreateFreespinsProps,
  cancelFreespinCampaign,
  createFreespinCampaign,
  fetchFreespinConfig,
} from '../lib/freeSpinsApi'
import { getUserByIdOrName } from 'src/modules/user'

export const createAdminRouter = () => {
  const router = Router()

  router.post(
    '/freespins/create',
    api.check,
    ...roleCheck([{ resource: 'freespins', action: 'create' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, gameIdentifier, campaignName, rounds, betLevel, reason } =
        req.body

      if (!userId || typeof userId !== 'string') {
        throw new APIValidationError('api__invalid_param', ['userId'])
      }

      if (!gameIdentifier || typeof gameIdentifier !== 'string') {
        throw new APIValidationError('api__invalid_param', ['gameIdentifier'])
      }

      if (!campaignName || typeof campaignName !== 'string') {
        throw new APIValidationError('api__invalid_param', ['campaignName'])
      }

      const freeSpinGame = await getGame({ identifier: gameIdentifier })
      if (!freeSpinGame) {
        throw new APIValidationError('Game does not exist')
      }
      if (!freeSpinGame.hasFreespins) {
        throw new APIValidationError('Game does not support freespins')
      }
      if (!rounds || parseFloat(rounds) < 1) {
        throw new APIValidationError('Must supply a positive number of rounds')
      }
      if (!betLevel || typeof betLevel !== 'string') {
        throw new APIValidationError('Must specify a bet level')
      }

      const freespinResponse = await createFreespinCampaign({
        issuerId: adminUser.id,
        reason,
        userId,
        campaignName,
        game: freeSpinGame,
        rounds,
        betLevel,
      })

      return freespinResponse
    }),
  )

  router.post(
    '/freespins/cancel',
    api.check,
    ...roleCheck([{ resource: 'freespins', action: 'delete' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { freespinObjectId } = req.body

      if (!freespinObjectId || typeof freespinObjectId !== 'string') {
        throw new APIValidationError('api__invalid_param', ['freespinObjectId'])
      }
      const freespinResponse = await cancelFreespinCampaign(freespinObjectId)

      return freespinResponse
    }),
  )

  router.post(
    '/freespins/betLevels',
    api.check,
    ...roleCheck([{ resource: 'freespins', action: 'read' }]),
    api.validatedApiCall(async req => {
      const { gameIdentifier } = req.body
      if (!gameIdentifier || typeof gameIdentifier !== 'string') {
        throw new APIValidationError('api__invalid_param', ['gameId'])
      }
      const game = await getGame({ identifier: gameIdentifier })
      if (!game) {
        throw new APIValidationError('Game does not exist')
      }
      if (!game.hasFreespins) {
        throw new APIValidationError('Game does not support freespins')
      }
      const freespinResponse = await fetchFreespinConfig(game.gid)

      return freespinResponse.success ? freespinResponse.payload : {}
    }),
  )

  router.post(
    '/freespins/createBulk',
    api.check,
    ...roleCheck([{ resource: 'freespins', action: 'create_bulk' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { data, reason } = req.body

      if (!data || data.length === 0) {
        throw new APIValidationError('Error: No data given.')
      }

      // Validate all of these accounts exist.. throw an error if 1 does not exist.
      const rows = await Promise.all(
        (data as Array<Record<string, any>>).map(async (row, index) => {
          row.reason = reason
          if (!row.campaignName) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing campaign name.`,
            )
          }
          if (!row.rounds) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing rounds.`,
            )
          }

          if (!row.gameIdentifier) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing gameIdentifier.`,
            )
          }

          const rowGame = await getGame({ identifier: row.gameIdentifier })
          if (!rowGame) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Game ${row.gameId} does not exist.`,
            )
          }
          // appending the game to row for the api method
          row.rowGame = rowGame

          if (!row.betLevel) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing betLevel.`,
            )
          }

          if (!row.startDate) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing startDate.`,
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
      const errors: string[] = []
      const successes = []
      const responses = await Promise.all(
        rows.map(async row => {
          const { campaignName, rounds, rowGame, betLevel, startDate, reason } =
            row.data
          const userId = row.user.id

          const roundsInt = parseInt(rounds)
          try {
            const rowCampaignParams: CreateFreespinsProps = {
              issuerId: adminUser.id,
              reason,
              userId,
              campaignName,
              game: rowGame,
              rounds: roundsInt,
              betLevel,
              startDate: new Date(startDate).getTime(),
            }

            const apiResponse = await createFreespinCampaign(rowCampaignParams)
            if (!apiResponse.success) {
              throw new Error(apiResponse.message)
            }
            successes.push({ created: true })
            return {
              userId,
              rounds,
              campaignName,
              startDate,
              gameId: rowGame.identifier,
              betLevel,
              created: true,
            }
          } catch (err) {
            errors.push(err.message)
            return {
              userId,
              campaignName,
              rounds,
              startDate,
              gameId: rowGame.identifier,
              betLevel,
              created: false,
            }
          }
        }),
      )

      return {
        responses,
        errors: errors.length,
        successes: successes.length,
      }
    }),
  )

  return router
}
