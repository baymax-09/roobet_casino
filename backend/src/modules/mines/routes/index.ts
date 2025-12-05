import express from 'express'

import { type RouterApp, type RoobetReq } from 'src/util/api'
import { api } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { acquireLock } from 'src/util/named-lock'
import { Mutex } from 'src/util/redisModels'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'

import {
  getActiveMinesGame,
  startMines,
  selectCard,
  cashoutByActiveGameId,
  autoBetMines,
  getGameboardSettings,
} from '../lib/mines'
import { getMinesHistoryForUser } from 'src/modules/mines/documents/mines_history'
import { acquireHouseGameRoundLock } from 'src/modules/game'
import { gridSizes } from '../documents/active_mines_games'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/mines', router)

  router.get(
    '/getActiveGame',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      return await getActiveMinesGame(user)
    }),
  )

  router.get(
    '/getRecentGames',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      return {
        history: await getMinesHistoryForUser({ userId: user.id }),
      }
    }),
  )

  router.post(
    '/start',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq

      const roundLock = await acquireHouseGameRoundLock('mines', user.id)

      if (!roundLock) {
        throw new APIValidationError('slow_down')
      }

      try {
        const {
          clientSeed,
          amount,
          minesCount,
          freeBetItemId,
          gridCount = 25,
        } = req.body
        if (clientSeed.length > 25) {
          throw new APIValidationError('max__seed_len')
        }

        if (typeof clientSeed !== 'string') {
          throw new APIValidationError('game__client_seed_must_be_string')
        }

        if (!amount) {
          throw new APIValidationError('supply__amount')
        }

        if (isNaN(amount)) {
          throw new APIValidationError('invalid_amount')
        }

        if (!minesCount) {
          throw new APIValidationError('mines__count')
        }

        if (
          isNaN(parseInt(minesCount)) ||
          minesCount > gridCount ||
          minesCount < 1
        ) {
          throw new APIValidationError('invalid__mines_count')
        }

        if (!gridSizes.includes(gridCount)) {
          throw new APIValidationError('invalid__grid_count')
        }

        const roundBeingModified = await Mutex.checkMutex(
          'roundModify',
          user.id,
        )
        if (roundBeingModified) {
          throw new APIValidationError('game__delay')
        }
        await Mutex.setMutex('roundUse', user.id, 5)

        return await startMines(
          user,
          parseFloat(amount),
          parseInt(minesCount),
          clientSeed,
          freeBetItemId,
          parseInt(gridCount),
        )
      } finally {
        roundLock.release()
      }
    }),
  )

  router.get(
    '/gameboardSettings',
    api.validatedApiCall(async () => {
      return getGameboardSettings()
    }),
  )

  router.post(
    '/selectCard',
    api.check,
    api.validatedApiCall(async req => {
      // selectedCard should be an integer between 0 and 24.
      const { activeGameId, selectedCard } = req.body
      const { user } = req as RoobetReq

      if (!activeGameId) {
        throw new APIValidationError('round__id')
      }

      if (typeof selectedCard !== 'number') {
        throw new APIValidationError('card__number')
      }

      if (isNaN(selectedCard) || selectedCard < 0) {
        throw new APIValidationError('invalid__card_num')
      }
      await acquireLock([user.id, 'mines'], 100)

      return await selectCard(activeGameId, selectedCard, user)
    }),
  )

  router.post(
    '/autoBet',
    api.check,
    api.validatedApiCall(async req => {
      // cardNumber should be an integer between 1 and 25
      const { user } = req as RoobetReq

      const roundLock = await acquireHouseGameRoundLock('mines', user.id)

      if (!roundLock) {
        throw new APIValidationError('slow_down')
      }

      try {
        const {
          clientSeed,
          amount,
          minesCount,
          freeBetItemId,
          selectedCards,
          gridCount = 25,
        } = req.body

        if (clientSeed.length > 25) {
          throw new APIValidationError('max__seed_len')
        }

        if (typeof clientSeed !== 'string') {
          throw new APIValidationError('game__client_seed_must_be_string')
        }

        if (!amount) {
          throw new APIValidationError('supply__amount')
        }

        if (isNaN(amount)) {
          throw new APIValidationError('invalid_amount')
        }

        if (!minesCount) {
          throw new APIValidationError('mines__count')
        }

        if (!gridSizes.includes(gridCount)) {
          throw new APIValidationError('invalid__grid_count')
        }

        if (
          isNaN(parseInt(minesCount)) ||
          minesCount > gridCount ||
          minesCount < 1
        ) {
          throw new APIValidationError('invalid__mines_count')
        }

        // Check if selectedCards is an array
        if (!Array.isArray(selectedCards)) {
          throw new APIValidationError('card__number')
        }

        // Check if selectedCards is an array of integers
        if (!selectedCards.every(card => typeof card === 'number')) {
          throw new APIValidationError('card__number')
        }

        // Check if selectedCards is an array of integers between 1 and gridCount(25 || 36 || 49 || 64)
        if (
          !selectedCards.every(
            card => !isNaN(card) && card >= 0 && card <= gridCount - 1,
          )
        ) {
          throw new APIValidationError('invalid__card_num')
        }

        return await autoBetMines(
          user,
          selectedCards,
          parseFloat(amount),
          clientSeed,
          freeBetItemId,
          parseInt(minesCount),
          parseInt(gridCount),
        )
      } finally {
        await roundLock.release()
      }
    }),
  )

  router.post(
    '/cashout',
    api.check,
    api.validatedApiCall(async req => {
      const { activeGameId } = req.body
      const { user } = req as RoobetReq

      // This used to be passed into cashoutByActiveGameId, which now queries RethinkDB for the user's active game
      if (!activeGameId) {
        throw new APIValidationError('round__bet_id')
      }

      await acquireLock([user.id, 'mines'], 200)
      return await cashoutByActiveGameId(user)
    }),
  )
}
