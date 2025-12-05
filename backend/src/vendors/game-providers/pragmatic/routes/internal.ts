import express from 'express'

import { config, getFrontendUrlFromReq } from 'src/system'
import { api, type Router, type RoobetReq } from 'src/util/api'

import { APIValidationError } from 'src/util/errors'
import { logAdminAction, roleCheck } from 'src/modules/admin/middleware'
import { getUserById, getUserByIdOrName } from 'src/modules/user/documents/user'
import { addAdminNoteToUser } from 'src/modules/admin'
import { createTransaction } from 'src/modules/user/documents/transaction'

import { generateAuthToken } from '../lib/auth'
import {
  createVariableFrb,
  cancelFrb,
  getBetScalesForGame,
  getGameUrl,
} from '../lib/api'
import {
  checkIfCurrencySupported,
  displayCurrencyFromRequestCurrency,
} from '../lib/currencies'

export default function (app: Router) {
  const router = express.Router()
  app.use('/internal', router)

  router.get(
    '/getGameConfig',
    api.check,
    api.validatedApiCall(async (req, res) => {
      const { user } = req as RoobetReq
      const token = generateAuthToken(user)
      const lobbyUrl = getFrontendUrlFromReq(req)
      const { gameId, lang, countryCode, isMobile, realMode, currency } =
        req.query

      const country = countryCode ?? user.countryCode
      const displayCurrency = displayCurrencyFromRequestCurrency(currency)
      if (!gameId || !lang || !isMobile) {
        throw new APIValidationError('api__missing_param')
      }

      if (typeof gameId !== 'string') {
        throw new APIValidationError('api__missing_param', ['gameId'])
      }

      if (typeof lang !== 'string') {
        throw new APIValidationError('api__missing_param', ['lang'])
      }

      if (typeof isMobile !== 'string') {
        throw new APIValidationError('api__missing_param', ['isMobile'])
      }

      if (typeof country !== 'string') {
        throw new APIValidationError('api__missing_param', ['countryCode'])
      }

      if (!displayCurrency) {
        throw new APIValidationError('api__missing_param', ['currency'])
      }

      // realMode is optional, but must be 'true' or 'false' if sent
      if (
        realMode &&
        !(typeof realMode === 'string' && ['true', 'false'].includes(realMode))
      ) {
        throw new APIValidationError('api__invalid_param', ['realMode'])
      }

      const unsupportedPragmaticCurrency =
        !checkIfCurrencySupported(displayCurrency)

      const gameURL = await getGameUrl(
        gameId,
        lang,
        token,
        user.id,
        isMobile,
        lobbyUrl,
        country,
        // inverse so that not including it defaults to real play
        realMode !== 'false',
        unsupportedPragmaticCurrency ? 'usd' : displayCurrency,
      )

      res.json({
        gameURL,
        ...(unsupportedPragmaticCurrency && {
          supportedCurrencies:
            config.displayCurrencies.filter(checkIfCurrencySupported) ?? [],
        }),
      })
    }),
  )

  router.post(
    '/createFreespins',
    api.check,
    ...roleCheck([{ resource: 'freespins', action: 'create' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { user: adminUser } = req as RoobetReq
      const { userId, gameId } = req.body
      let { rounds, periodOfTime, betPerRound, frType, reason } = req.body

      if (rounds) {
        rounds = parseInt(rounds)
      }
      if (betPerRound) {
        betPerRound = parseFloat(betPerRound)
      }
      if (periodOfTime) {
        periodOfTime = parseInt(periodOfTime)
      }
      if (rounds && periodOfTime) {
        throw new APIValidationError(
          'Rounds & Period of Time cannot both be non-zero.',
        )
      }

      const user = await getUserById(userId)
      if (!user) {
        throw new APIValidationError('No such user')
      }

      try {
        await createVariableFrb({
          userId,
          rounds,
          periodOfTime,
          gameId,
          betPerRound,
          frType,
          reason,
          issuerId: adminUser.id,
        })
      } catch (err) {
        throw new APIValidationError(err.toString())
      }

      await createTransaction({
        user,
        amount: 0,
        transactionType: 'bonus',
        meta: {
          rounds,
          periodOfTime,
          gameId,
          betPerRound,
          provider: 'pragmatic',
        },
        balanceType: 'crypto',
        resultantBalance: user.balance,
      })

      addAdminNoteToUser(
        userId,
        adminUser,
        `<b>ACP Action:</b> ${adminUser.name} issued ${rounds} rounds/${periodOfTime} time Pragmatic Freespins for ${gameId} and betPerRound of ${betPerRound}`,
      )
    }),
  )

  router.post(
    '/cancelFreespins',
    api.check,
    ...roleCheck([{ resource: 'freespins', action: 'delete' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { bonusCode } = req.body
      if (!bonusCode) {
        throw new APIValidationError('No bonusCode specified.')
      }

      return await cancelFrb(bonusCode)
    }),
  )

  router.get(
    '/getBetScalesForGame',
    api.check,
    ...roleCheck([{ resource: 'tpgames', action: 'read' }]),
    logAdminAction,
    api.validatedApiCall(async req => {
      const { gameId } = req.query
      if (typeof gameId !== 'string') {
        throw new APIValidationError('No gameId specified.')
      }

      return (await getBetScalesForGame(gameId)) || []
    }),
  )

  router.post(
    '/createFreespinsBulk',
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
          if (!row.periodOfTime && !row.rounds && row.frType !== 'F') {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing rounds and periodOfTime.`,
            )
          }

          if (!row.gameId) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing gameId.`,
            )
          }

          if (!row.betPerRound) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing betPerRound.`,
            )
          }

          if (!row.expirationDate) {
            throw new APIValidationError(
              `Error (row ${index + 1}): Missing expirationDate.`,
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
      const results = await Promise.all(
        rows.map(async row => {
          const {
            rounds,
            periodOfTime,
            gameId,
            betPerRound,
            frType,
            startDate,
            expirationDate,
            reason,
          } = row.data
          const userId = row.user.id

          const bprFloat = parseFloat(betPerRound)
          const roundsInt = parseInt(rounds)

          try {
            await createVariableFrb({
              userId,
              rounds: roundsInt,
              periodOfTime,
              gameId,
              betPerRound: bprFloat,
              frType,
              startDate,
              expirationDate,
              reason,
              issuerId: adminUser.id,
            })
            return {
              userId,
              rounds,
              periodOfTime,
              gameId,
              betPerRound,
              frType,
              startDate,
              expirationDate,
              created: true,
            }
          } catch (err) {
            return {
              userId,
              rounds,
              periodOfTime,
              gameId,
              betPerRound,
              frType,
              startDate,
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
