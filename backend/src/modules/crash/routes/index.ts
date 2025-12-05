import express from 'express'
import routeCache from 'route-cache'

import { config } from 'src/system'
import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import {
  cashoutCrashUser,
  getRecentCrashGames,
  getRecentCrashNumbers,
  trimForFrontend,
  joinCrashGame,
  getCurrentCrashGame,
  getActiveCrashGame,
  getCrashGameById,
  getCrashBetsByGameId,
} from '../documents/crash_game'
import { APIValidationError } from 'src/util/errors'
import { BasicCache } from 'src/util/redisModels'
import { ioRoute } from 'src/util/io'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'

import { safeCheckGameRunning } from '../lib/helpers/crash_bet'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'
import { crashLogger } from '../lib/logger'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/crash', router)

  router.get(
    '/getActiveGame',
    routeCache.cacheSeconds(2),
    api.validatedApiCall(async () => {
      return await getActiveCrashGame()
    }),
  )

  router.get(
    '/currentGame',
    api.validatedApiCall(async () => {
      const [game] = await getCurrentCrashGame()
      return trimForFrontend(game)
    }),
  )

  router.get(
    '/getGameById',
    api.validatedApiCall(async req => {
      const { id } = req.query

      if (typeof id !== 'string') {
        throw new APIValidationError('invalid_input')
      }

      const game = await getCrashGameById(id)
      if (!game) {
        throw new APIValidationError('game__invalid_game_id')
      }

      const bets = await getCrashBetsByGameId(id)
      return { game: trimForFrontend(game), bets }
    }),
  )

  router.get(
    '/recentGame',
    api.check,
    api.validatedApiCall(async req => {
      const { id } = req.query

      if (typeof id !== 'string') {
        throw new APIValidationError('invalid_input')
      }

      const game = await getCrashGameById(id)
      if (!game) {
        throw new APIValidationError('game__invalid_game_id')
      }
      return trimForFrontend(game)
    }),
  )

  router.get(
    '/recentNumbers',
    api.validatedApiCall(async () => {
      return await getRecentCrashNumbers()
    }),
  )

  router.get(
    '/recentGames',
    api.validatedApiCall(async req => {
      const pageNumber = req.query.pageNumber
        ? // @ts-expect-error how to type query strings? Also, parseInt(['1']) === 1
          parseInt(req.query.pageNumber)
        : 0
      return await getRecentCrashGames(pageNumber)
    }),
  )

  const countDecimals = function (value: number) {
    if (Math.floor(value) === value) {
      return 0
    }
    return value.toString().split('.')[1].length || 0
  }

  router.post(
    '/joinGame',
    countryIsBannedMiddleware,
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const {
        betAmount,
        autoCashout,
        autobet = false,
        freeBetItemId,
      } = req.body
      const amount = parseFloat(betAmount)
      const auto = parseFloat(autoCashout)
      if (amount > config.crash.maxBet) {
        const convertedMax = await exchangeAndFormatCurrency(
          config.crash.maxBet,
          user,
        )
        throw new APIValidationError('bet__convertedMaximum_bet', [
          `${convertedMax}`,
        ])
      }

      if (isNaN(amount) || amount <= 0) {
        throw new APIValidationError('bet__invalid')
      }

      if (isNaN(auto) || auto < 1.01) {
        throw new APIValidationError('crash__invalid_autocashout')
      }

      if (countDecimals(auto) > 2) {
        throw new APIValidationError('crash__invalid_autocashout')
      }

      if (auto * amount > config.bet.maxProfit) {
        const convertedMaxProfitAmount = await exchangeAndFormatCurrency(
          config.bet.maxProfit,
          user,
        )
        throw new APIValidationError('crash__max_profit', [
          convertedMaxProfitAmount,
        ])
      }

      const state = await BasicCache.get('crash', 'state')
      if (state !== 'TakingBets') {
        throw new APIValidationError('game__not_taking_bets')
      }

      await joinCrashGame(user, amount, auto, null, autobet, freeBetItemId)
    }),
  )

  router.get(
    '/state',
    api.validatedApiCall(async () => {
      return await BasicCache.get('crash', 'state')
    }),
  )

  router.post(
    '/cashout',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      crashLogger('/cashout', { userId: user.id }).info(
        `${user.id} attempting crash cashout`,
        { req: req.body },
      )
      await safeCheckGameRunning()
      await cashoutCrashUser(user.id, req.body.betId)
      return true
    }),
  )

  ioRoute('crash_cashout', async (data, userId) => {
    crashLogger('crash_cashout', { userId }).info(
      `${userId} attempting crash cashout`,
      { data },
    )
    await safeCheckGameRunning()
    await cashoutCrashUser(userId, data.betId)
    return true
  })
}
