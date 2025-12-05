import express from 'express'

import { config } from 'src/system'
import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { acquireLock } from 'src/util/named-lock'
import { Mutex } from 'src/util/redisModels'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'

import { getActiveCashDashGame } from '../documents/active_cash_dash_games'
import { selectCard } from '../lib/card'
import { getGameboardLayout, isValidDifficulty } from '../lib/gameboard'
import { CashDashGame } from '../lib/game'
import { GameName } from '..'
import { acquireHouseGameRoundLock } from 'src/modules/game'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/cash-dash', router)

  router.get(
    '/getActiveGame',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      return await getActiveCashDashGame(user)
    }),
  )

  router.post(
    '/start',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq

      const roundLock = await acquireHouseGameRoundLock('cashdash', user.id)

      if (!roundLock) {
        throw new APIValidationError('slow_down')
      }

      try {
        const { clientSeed, amount, difficulty, freeBetItemId } = req.body

        if (clientSeed.length > 25) {
          throw new APIValidationError('game__maximum_seed_length')
        }

        if (typeof clientSeed !== 'string') {
          throw new APIValidationError('game__client_seed_must_be_string')
        }

        if (
          !amount ||
          isNaN(amount) ||
          amount < config[GameName].minBet ||
          amount > config[GameName].maxBet
        ) {
          throw new APIValidationError('invalid_amount')
        }

        if (!difficulty || !isValidDifficulty(difficulty)) {
          throw new APIValidationError('cash_dash__invalid_difficulty')
        }

        const roundBeingModified = await Mutex.checkMutex(
          'roundModify',
          user.id,
        )
        if (roundBeingModified) {
          throw new APIValidationError('please_wait_seconds', ['5'])
        }

        await Mutex.setMutex('roundUse', user.id, 5)

        const layout = getGameboardLayout(difficulty, parseFloat(amount))

        const game = await CashDashGame.start(
          user,
          parseFloat(amount),
          difficulty,
          clientSeed,
          freeBetItemId,
        )

        return {
          ...game,
          game,
          layout,
        }
      } finally {
        await roundLock.release()
      }
    }),
  )

  router.post(
    '/selectCard',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { activeGameId, selectedCard } = req.body

      if (!activeGameId) {
        throw new APIValidationError('game__invalid_game_id')
      }

      return await selectCard(activeGameId, parseInt(selectedCard), user)
    }),
  )

  router.get(
    '/gameboardLayout',
    api.validatedApiCall(async req => {
      const { amount, difficulty } = req.query

      if (typeof amount !== 'string') {
        throw new APIValidationError('invalid_amount')
      }

      const parsedAmount = parseFloat(amount)

      if (
        isNaN(parsedAmount) ||
        parsedAmount < config[GameName].minBet ||
        parsedAmount > config[GameName].maxBet
      ) {
        throw new APIValidationError('invalid_amount')
      }

      if (!isValidDifficulty(difficulty)) {
        throw new APIValidationError('cash_dash__invalid_difficulty')
      }

      return getGameboardLayout(difficulty, parsedAmount)
    }),
  )

  router.post(
    '/cashout',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { activeGameId } = req.body

      if (!activeGameId) {
        throw new APIValidationError('game__invalid_game_id')
      }

      await acquireLock([user.id, 'cash-dash'], 500)
      return await CashDashGame.end(activeGameId, true)
    }),
  )
}
