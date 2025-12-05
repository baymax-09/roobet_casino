import { config } from 'src/system'
import { APIValidationError } from 'src/util/errors'
import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import { determineSingleFeatureAccess } from 'src/util/features'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'

import {
  trimForFrontend,
  getRouletteBetsByGameId,
  getRouletteGameById,
  getRecentRouletteNumbers,
  getActiveRouletteGame,
  getCurrentRouletteGame,
  joinRouletteGame,
  getRecentRouletteGames,
  ROULETTE_JACKPOT_ID,
  ROULETTE_GOLD_GAMES_ID,
} from 'src/modules/roulette/documents/roulette_games'
import { getBetInfo, isWinningNumber } from '../constant/roulette'
import { RouletteGoldGames, RouletteJackpot } from '../documents'

export default function (app: RouterApp) {
  app.get(
    '/roulette/getActiveGame',
    api.validatedApiCall(async () => {
      return await getActiveRouletteGame()
    }),
  )

  app.get(
    '/roulette/currentGame',
    api.check,
    api.validatedApiCall(async () => {
      const [game] = await getCurrentRouletteGame()
      return trimForFrontend(game)
    }),
  )

  app.get(
    '/roulette/getGameById',
    api.check,
    api.validatedApiCall(async req => {
      const { id } = req.query
      if (typeof id !== 'string') {
        throw new APIValidationError('invalid_input')
      }

      const game = await getRouletteGameById(id)
      if (!game) {
        throw new APIValidationError('game__invalid_game_id')
      }

      const bets = await getRouletteBetsByGameId(id)
      return { game: trimForFrontend(game), bets }
    }),
  )

  app.get(
    '/roulette/recentGame',
    api.check,
    api.validatedApiCall(async req => {
      const { id } = req.query
      if (typeof id !== 'string') {
        throw new APIValidationError('api__invalid_param', ['id'])
      }

      const game = await getRouletteGameById(id)
      if (!game) {
        throw new APIValidationError('game__does_not_exist')
      }

      if (game.state !== 'Over') {
        throw new APIValidationError('crash__game_in_progress')
      } else {
        return trimForFrontend(game)
      }
    }),
  )

  app.post(
    '/roulette/joinGame',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { betAmount, freeBetItemId } = req.body
      let { betSelection } = req.body
      const amount = Math.abs(parseFloat(betAmount))
      betSelection = parseInt(betSelection)

      if (!isWinningNumber(betSelection)) {
        throw new APIValidationError('bet__invalid__selection')
      }

      if (amount > config.roulette.maxBet) {
        const convertedMax = await exchangeAndFormatCurrency(
          config.roulette.maxBet,
          user,
        )
        throw new APIValidationError('bet__convertedMaximum_bet', [
          `${convertedMax}`,
        ])
      }

      if (isNaN(betAmount)) {
        throw new APIValidationError('bet__invalid')
      }

      const betInfo = await getBetInfo()

      if (
        typeof betSelection !== 'number' ||
        !betInfo[betSelection]?.multiplier
      ) {
        throw new APIValidationError('bet__invalid')
      }

      if (betInfo[betSelection]?.multiplier * amount > config.bet.maxProfit) {
        const convertedMaxProfitAmount = await exchangeAndFormatCurrency(
          config.bet.maxProfit,
          user,
        )
        throw new APIValidationError('bet__exceeds_max_profit', [
          convertedMaxProfitAmount,
        ])
      }

      await joinRouletteGame(user, amount, betSelection, freeBetItemId)
    }),
  )

  app.get(
    '/roulette/recentNumbers',
    api.validatedApiCall(async () => {
      return await getRecentRouletteNumbers()
    }),
  )

  app.get(
    '/roulette/recentGames',
    api.validatedApiCall(async req => {
      const { pageNumber: reqPageNumber } = req.query
      const pageNumber =
        typeof reqPageNumber === 'string' ? parseInt(reqPageNumber) : 0

      return await getRecentRouletteGames(pageNumber)
    }),
  )

  app.get(
    '/roulette/jackpotState',
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const rouletteRework = await determineSingleFeatureAccess({
        countryCode: user.countryCode,
        user,
        featureName: 'housegames:roulette',
      })
      if (!rouletteRework) {
        throw new APIValidationError('action__disabled')
      }

      const jackpotDocument =
        await RouletteJackpot.getRouletteJackpotById(ROULETTE_JACKPOT_ID)
      let jackpotAmount = 0
      if (jackpotDocument) {
        jackpotAmount = jackpotDocument.jackpotAmount
      }

      const goldGamesDocument = await RouletteGoldGames.getGoldGameById(
        ROULETTE_GOLD_GAMES_ID,
      )
      let comboCount = 0
      if (goldGamesDocument) {
        let lastGoldGameIds = []
        if (goldGamesDocument.gameIds) {
          lastGoldGameIds = JSON.parse(goldGamesDocument.gameIds)
          comboCount = lastGoldGameIds.length
        }
      }

      return { jackpotAmount, comboCount }
    }),
  )
}
