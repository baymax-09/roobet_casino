import express from 'express'

import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { Mutex } from 'src/util/redisModels'
import * as RateLimiter from 'src/util/rateLimiter'
import { sleep } from 'src/util/helpers/timer'
import { type Model } from 'mongoose'

import {
  isHouseWithVerificationGameName,
  type HouseGamesWithRoundTable,
  type HouseGamesWithVerification,
} from '../types'
import { getRoundTableForGame } from '../lib/round'
import { startVerification } from 'src/modules/game/lib/provably_fair/verify'
import { getActiveGameByUser } from 'src/modules/game/documents/active_game'
import {
  endCurrentRoundForUser,
  getOrCreateRoundForUser,
} from 'src/modules/game/lib/provably_fair/userGenerated'
import { getLinearMinesActiveGamesForUser } from 'src/modules/linearmines/documents/active_linear_mines_games'
import { ActiveTowersGamesModel } from 'src/modules/towers/documents/active_towers_games'
import { ActiveMinesGames } from 'src/modules/mines/documents/active_mines_games'
import { ActiveCashDashGamesModel } from 'src/modules/cash-dash/documents/active_cash_dash_games'
import gameHistoryRouter from './admin'
import { acquireHouseGameRoundLock } from '../lib'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/game', router)
  gameHistoryRouter(router)

  const endRoundRoute = api.validatedApiCall(async req => {
    await sleep(Math.random() * 1000)
    const { gameName } = req.params as { gameName: HouseGamesWithRoundTable }

    const { user } = req as RoobetReq

    if (!isHouseWithVerificationGameName(gameName)) {
      throw new APIValidationError('game__not_found')
    }

    const roundLock = await acquireHouseGameRoundLock(gameName, user.id)

    if (!roundLock) {
      throw new APIValidationError('slow_down')
    }

    try {
      const roundBeingUsed = await Mutex.checkMutex('roundUse', user.id)

      if (roundBeingUsed) {
        throw new APIValidationError('please_wait_seconds', ['5'])
      }

      await Mutex.setMutex('roundModify', user.id, 5)

      switch (gameName) {
        case 'mines':
          {
            const minesGame = await getActiveGameByUser(
              ActiveMinesGames,
              user.id,
            )
            if (minesGame) {
              throw new APIValidationError('game__still_active')
            }
          }
          break
        case 'towers':
          {
            const towersGame = await getActiveGameByUser(
              ActiveTowersGamesModel,
              user.id,
            )
            if (towersGame) {
              throw new APIValidationError('game__still_active')
            }
          }
          break
        case 'cashdash':
          {
            const cashdashGame = await getActiveGameByUser(
              ActiveCashDashGamesModel,
              user.id,
            )
            if (cashdashGame) {
              throw new APIValidationError('game__still_active')
            }
          }
          break
        case 'linearmines':
          {
            const linearminesGame = await getLinearMinesActiveGamesForUser({
              userId: user.id,
            })
            if (linearminesGame && linearminesGame.length > 0) {
              throw new APIValidationError('game__still_active')
            }
          }
          break
        // Coinflip should NOT be supported right now. If we do add support we need to check
        // for ANY active games and throw. See the check in `verifyCoinFlip`.
        // case 'coinflip':
        case 'plinko':
        case 'dice':
        case 'hilo':
          break
        default:
          throw new APIValidationError('game__not_found')
      }

      const roundTable = getRoundTableForGame(gameName)

      const previousRoundSeed = await endCurrentRoundForUser(
        user,
        gameName,
        roundTable,
      )

      const newRound = await getOrCreateRoundForUser(user, gameName, roundTable)

      return { round: { ...newRound, clientSeed: null }, previousRoundSeed }
    } finally {
      await roundLock.release()
    }
  })

  const endRoundMiddleware = RateLimiter.ipThrottleMiddleware('endRound')
  router.post(
    '/:gameName/endRound',
    api.check,
    endRoundMiddleware,
    endRoundRoute,
  )

  router.get(
    '/:gameName/getRoundById',
    api.validatedApiCall(async req => {
      const { gameName } = req.params as { gameName: HouseGamesWithRoundTable }
      const { id } = req.query
      const roundTable: Model<any> = getRoundTableForGame(gameName)
      const round = await roundTable.findById(id)

      return { round }
    }),
  )

  router.get(
    '/:gameName/currentRoundHash',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { clientSeed } = req.query
      const { gameName } = req.params as { gameName: HouseGamesWithRoundTable }
      const roundTable = getRoundTableForGame(gameName)
      const round = await getOrCreateRoundForUser(user, gameName, roundTable)
      return { round: { ...round, clientSeed } }
    }),
  )

  router.get(
    '/:gameName/verify',
    api.check,

    api.validatedApiCall(async req => {
      const { user } = req as unknown as RoobetReq
      const { gameName } = req.params as {
        gameName: HouseGamesWithVerification
      }
      const { betId } = req.query as { betId: string }

      if (!isHouseWithVerificationGameName(gameName)) {
        throw new APIValidationError('game__not_found')
      }

      const roundLock = await acquireHouseGameRoundLock(gameName, user.id)

      if (!roundLock) {
        throw new APIValidationError('slow_down')
      }

      try {
        // Verify round is not in used.
        const roundBeingUsed = await Mutex.checkMutex('roundUse', user.id)

        if (roundBeingUsed) {
          throw new APIValidationError('please_wait_seconds', ['5'])
        }

        // Set round modify mutex to prevent further round actions in other processes.
        await Mutex.setMutex('roundModify', user.id, 5)

        return await startVerification(user, gameName, betId)
      } finally {
        await roundLock?.release()
      }
    }),
  )
}
