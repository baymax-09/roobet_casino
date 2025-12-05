import express from 'express'

import { type RouterApp, type RoobetReq } from 'src/util/api'
import { api } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { acquireLock } from 'src/util/named-lock'
import { Mutex } from 'src/util/redisModels'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'

import {
  getActiveLinearMinesGame,
  startLinearMines,
  selectCard,
  cashoutByActiveGameId,
  getGameboardSettings,
} from '../lib/linear_mines'
import { getLinearMinesHistoryForUser } from 'src/modules/linearmines/documents/linear_mines_history'
import { acquireHouseGameRoundLock } from 'src/modules/game'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/linearmines', router)

  router.get(
    '/getActiveGame',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      return await getActiveLinearMinesGame(user)
    }),
  )

  router.get(
    '/getRecentGames',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      return {
        history: await getLinearMinesHistoryForUser({ userId: user.id }),
      }
    }),
  )

  router.post(
    '/start',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq

      const roundLock = await acquireHouseGameRoundLock('linearmines', user.id)

      if (!roundLock) {
        throw new APIValidationError('slow_down')
      }

      try {
        const { clientSeed, amount, minesCount, freeBetItemId } = req.body

        if (clientSeed.length > 25) {
          throw new APIValidationError('max__seed_len')
        }

        if (typeof clientSeed !== 'string') {
          throw new APIValidationError('Client seed must be a string.')
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

        if (isNaN(parseInt(minesCount)) || minesCount > 24 || minesCount < 1) {
          throw new APIValidationError('invalid__mines_count')
        }

        const roundBeingModified = await Mutex.checkMutex(
          'roundModify',
          user.id,
        )
        if (roundBeingModified) {
          throw new APIValidationError('game__delay')
        }
        await Mutex.setMutex('roundUse', user.id, 5)

        return await startLinearMines(
          user,
          parseFloat(amount),
          parseInt(minesCount),
          clientSeed,
          freeBetItemId,
        )
      } finally {
        await roundLock.release()
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

      if (isNaN(selectedCard) || selectedCard > 24 || selectedCard < 0) {
        throw new APIValidationError('invalid__card_num')
      }

      await acquireLock([user.id, 'linearmines'], 100)

      return await selectCard(activeGameId, selectedCard, user)
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

      await acquireLock([user.id, 'linearmines'], 200)
      return await cashoutByActiveGameId(user)
    }),
  )
}
