import express from 'express'

import { type RouterApp, type RoobetReq } from 'src/util/api'
import { api } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'
import {
  acquireHouseGameRoundLock,
  emitSocketEventForGame,
} from 'src/modules/game'
import { getSelectedBalanceFromUser } from 'src/modules/user/balance'
import { Mutex } from 'src/util/redisModels'

import { validateOpenGameInputs } from './inputValidation'
import {
  joinOpenCoinFlipGame,
  openCoinFlipGame,
  summonBot,
} from '../lib/openCoinFlipGame'
import {
  getCoinFlipActiveGamesForOtherUsers,
  getCoinFlipActiveGamesForUser,
  getCoinFlipGamesForUser,
  setAllGamesAsDismissed,
  setGameAsDismissed,
} from '../documents/coinFlipGames'
import {
  getOrCreateAction,
  deleteAction,
} from '../documents/coinFlipIdempotency'
import { refundCoinFlipGame } from '../lib/refundCoinfFlipGame'

const getBalanceUpdateTimestamp = (balanceDelay?: string) => {
  const balanceUpdateDelayMS = balanceDelay ? Number(balanceDelay) : 0
  return new Date(Date.now() + balanceUpdateDelayMS)
}

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/coinflip', router)

  router.post(
    '/start',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq

      const roundLock = await acquireHouseGameRoundLock('coinflip', user.id)

      if (!roundLock) {
        throw new APIValidationError('game__action_lock')
      }

      const { amount, guess, count } = req.body

      try {
        await validateOpenGameInputs(amount, guess, count, user)
        // TODO we should redesign these balance checks because
        // balance checks are currently coupled with the bet system
        const balanceReturn = await getSelectedBalanceFromUser({ user })
        const availableBalance = balanceReturn.balance

        if (availableBalance < parseFloat(amount) * count) {
          throw new APIValidationError('multiple__bet__not_enough_balance', [
            `${count}`,
            'Coinflip',
          ])
        }

        const roundBeingModified = await Mutex.checkMutex(
          'roundModify',
          user.id,
        )
        if (roundBeingModified) {
          throw new APIValidationError('game__delay')
        }
        await Mutex.setMutex('roundUse', user.id, 5)

        const coinflipDataArray = []
        const coinflipWSEventArray = []
        const countNumber = parseInt(count)

        for (let i = 0; i < countNumber; i++) {
          const coinflipGame = await openCoinFlipGame(
            user,
            guess,
            parseFloat(amount),
          )

          coinflipWSEventArray.push(coinflipGame)

          coinflipDataArray.push(coinflipGame)
        }

        const filteredDataArray = coinflipDataArray.filter(game => !!game)
        const filteredWSArray = coinflipWSEventArray.filter(game => !!game)

        emitSocketEventForGame('coinflip', 'newCoinFlipGame', filteredWSArray)

        return { success: true, coinflipDataArray: filteredDataArray }
      } finally {
        await roundLock.release()
      }
    }),
  )

  router.get(
    '/fetchUserActiveGames',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { withFinished } = req.query

      return await getCoinFlipActiveGamesForUser({
        userId: user.id,
        withFinished: withFinished === 'true',
      })
    }),
  )

  router.post(
    '/fetchOtherActiveGames',
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { pageNumberStr } = req.body

      let pageNumber = 0
      if (pageNumberStr && !isNaN(pageNumberStr)) {
        pageNumber = parseInt(pageNumberStr)
      }

      return await getCoinFlipActiveGamesForOtherUsers({
        userId: user.id ?? '',
        pageNumber,
      })
    }),
  )

  router.post(
    '/fetchUserGames',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { pageNumberStr } = req.body

      let pageNumber = 0
      if (pageNumberStr && !isNaN(pageNumberStr)) {
        pageNumber = parseInt(pageNumberStr)
      }

      return await getCoinFlipGamesForUser({ userId: user.id, pageNumber })
    }),
  )

  router.post(
    '/summonBot',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq

      const lock = await acquireHouseGameRoundLock('coinflip', user.id)

      if (!lock) {
        throw new APIValidationError('game__action_lock')
      }

      try {
        const { gameId, balanceDelay } = req.body

        if (!gameId) {
          throw new APIValidationError('supply__gameId')
        }

        if (balanceDelay) {
          // Check that balanceDelay parses to an integer greater than or equal to 0
          if (
            !Number.isInteger(Number(balanceDelay)) ||
            Number(balanceDelay) < 0
          ) {
            throw new APIValidationError('balance_delay_invalid')
          }
        }

        const roundBeingModified = await Mutex.checkMutex(
          'roundModify',
          user.id,
        )
        if (roundBeingModified) {
          throw new APIValidationError('game__delay')
        }
        await Mutex.setMutex('roundUse', user.id, 5)

        // Create action document or lookup existing if possible.
        const { action: actionDocument, existed } = await getOrCreateAction({
          gameId,
          action: 'join',
        })
        try {
          if (!actionDocument || existed) {
            throw new APIValidationError('game__action_lock')
          }

          const response = await summonBot(
            user.id,
            gameId,
            getBalanceUpdateTimestamp(balanceDelay),
          )

          if (!response.success) {
            throw new APIValidationError('game_bot')
          }
          emitSocketEventForGame(
            'coinflip',
            'addBotToCoinFlipGame',
            response.coinflipGame,
          )
        } catch (err) {
          if (actionDocument) {
            await deleteAction(actionDocument._id)
          }
          throw err
        }
      } finally {
        await lock.release()
      }
    }),
  )

  router.post(
    '/joinGame',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq

      const lock = await acquireHouseGameRoundLock('coinflip', user.id)

      if (!lock) {
        throw new APIValidationError('game__action_lock')
      }

      try {
        const { gameId, balanceDelay } = req.body

        if (!gameId) {
          throw new APIValidationError('supply__gameId')
        }

        if (balanceDelay) {
          // Check that balanceDelay parses to an integer greater than or equal to 0
          if (
            !Number.isInteger(Number(balanceDelay)) ||
            Number(balanceDelay) < 0
          ) {
            throw new APIValidationError('balance_delay_invalid')
          }
        }

        const roundBeingModified = await Mutex.checkMutex(
          'roundModify',
          user.id,
        )
        if (roundBeingModified) {
          throw new APIValidationError('game__delay')
        }
        await Mutex.setMutex('roundUse', user.id, 5)

        // Create action document or lookup existing if possible.
        const { action: actionDocument, existed } = await getOrCreateAction({
          gameId,
          action: 'join',
        })

        try {
          if (!actionDocument || existed) {
            throw new APIValidationError('game__action_lock')
          }

          const joinedGame = await joinOpenCoinFlipGame(
            user,
            gameId,
            getBalanceUpdateTimestamp(balanceDelay),
          )

          if (!joinedGame) {
            await deleteAction(actionDocument._id)
          }

          if (joinedGame) {
            emitSocketEventForGame('coinflip', 'joinCoinFlipGame', joinedGame)
          }

          return joinedGame
        } catch (err) {
          if (actionDocument) {
            await deleteAction(actionDocument._id)
          }
          throw err
        }
      } finally {
        await lock.release()
      }
    }),
  )

  router.post(
    '/refundGame',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { gameId } = req.body

      if (!gameId) {
        throw new APIValidationError('supply__gameId')
      }

      // Create action document or lookup existing if possible.
      const { action: actionDocument, existed } = await getOrCreateAction({
        gameId,
        action: 'refund',
      })

      const result = { gameId, success: false }
      try {
        if (!actionDocument || existed) {
          throw new APIValidationError('game__action_lock')
        }

        const refundResult = await refundCoinFlipGame(user, gameId)

        if (refundResult.success) {
          emitSocketEventForGame('coinflip', 'refundCoinFlipGame', refundResult)
        }

        result.success = refundResult.success
      } catch (err) {
        if (actionDocument) {
          await deleteAction(actionDocument._id)
        }
        throw err
      }
      return result
    }),
  )

  router.post(
    '/dismissGame',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { gameId } = req.body

      if (!gameId) {
        throw new APIValidationError('supply__gameId')
      }

      const coinflipData = await setGameAsDismissed({ userId: user.id, gameId })

      return { success: !!coinflipData }
    }),
  )

  router.post(
    '/dismissAllGames',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq

      const coinflipData = await setAllGamesAsDismissed({ userId: user.id })

      return { success: !!coinflipData }
    }),
  )
}
