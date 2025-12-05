import express from 'express'
import routeCache from 'route-cache'

import { config } from 'src/system'
import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import {
  cashoutHotboxUser,
  getRecentHotboxGames,
  getRecentHotboxNumbers,
  trimForFrontend,
  joinHotboxGame,
  getCurrentHotboxGame,
  getActiveHotboxGame,
  getHotboxGameById,
  getHotboxBetsByGameId,
} from '../documents/hotbox_game'
import { APIValidationError } from 'src/util/errors'
import { BasicCache } from 'src/util/redisModels'
import { ioRoute } from 'src/util/io'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'

import { safeCheckGameRunning } from '../lib/helpers/hotbox_bet'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'
import { hotboxLogger } from '../lib/logger'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/hotbox', router)

  router.get(
    '/getActiveGame',
    routeCache.cacheSeconds(2),
    api.validatedApiCall(async () => {
      return await getActiveHotboxGame()
    }),
  )

  router.get(
    '/currentGame',
    api.validatedApiCall(async () => {
      const [game] = await getCurrentHotboxGame()
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

      const game = await getHotboxGameById(id)
      if (!game) {
        throw new APIValidationError('game__invalid_game_id')
      }

      const bets = await getHotboxBetsByGameId(id)
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

      const game = await getHotboxGameById(id)
      if (!game) {
        throw new APIValidationError('game__invalid_game_id')
      }
      return trimForFrontend(game)
    }),
  )

  router.get(
    '/recentNumbers',
    api.validatedApiCall(async () => {
      return await getRecentHotboxNumbers()
    }),
  )

  router.get(
    '/recentGames',
    api.validatedApiCall(async req => {
      const pageNumber = req.query.pageNumber
        ? // @ts-expect-error how to type query strings? Also, parseInt(['1']) === 1
          parseInt(req.query.pageNumber)
        : 0
      return await getRecentHotboxGames(pageNumber)
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
      if (amount > config.hotbox.maxBet) {
        const convertedMax = await exchangeAndFormatCurrency(
          config.hotbox.maxBet,
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
        throw new APIValidationError('hotbox__invalid_autocashout')
      }

      if (countDecimals(auto) > 2) {
        throw new APIValidationError('hotbox__invalid_autocashout')
      }

      if (auto * amount > config.bet.maxProfit) {
        const convertedMaxProfitAmount = await exchangeAndFormatCurrency(
          config.bet.maxProfit,
          user,
        )
        throw new APIValidationError('hotbox__max_profit', [
          convertedMaxProfitAmount,
        ])
      }

      const state = await BasicCache.get('hotbox', 'state')
      if (state !== 'TakingBets') {
        throw new APIValidationError('game__not_taking_bets')
      }

      await joinHotboxGame(user, amount, auto, null, autobet, freeBetItemId)
    }),
  )

  router.get(
    '/state',
    api.validatedApiCall(async () => {
      return await BasicCache.get('hotbox', 'state')
    }),
  )

  router.post(
    '/cashout',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      hotboxLogger('/cashout', { userId: user.id }).info(
        `Attempting hotbox cashout`,
        req.body,
      )
      await safeCheckGameRunning()
      await cashoutHotboxUser(user.id, req.body.betId)
      return true
    }),
  )

  ioRoute('hotbox_cashout', async (data, userId) => {
    hotboxLogger('hotbox_cashout', { userId }).info(
      `Attempting hotbox cashout`,
      data,
    )
    await safeCheckGameRunning()
    await cashoutHotboxUser(userId, data.betId)
    return true
  })
}
