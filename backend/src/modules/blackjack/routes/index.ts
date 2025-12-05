import express from 'express'

import {
  BlackjackError,
  HandActionType,
  WagerOutcomeType,
  type BlackjackActionRequest,
  type BlackjackInsureRequest,
  type BlackjackStartGameRequest,
  type UserSeatRequest,
} from 'src/modules/blackjack'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'
import { config } from 'src/system'
import { api, type RoobetReq, type RouterApp } from 'src/util/api'
import {
  createUserGame,
  doubleDownUserGame,
  getUserGame,
  getUserGames,
  hitUserGame,
  insureUserGame,
  splitUserGame,
  standUserGame,
  startUserGame,
} from '../lib/api'
import * as blackjack from './validation'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/blackjack', router)

  router.post(
    '/',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      return await createUserGame(user).catch(err => {
        throw BlackjackError.logAndReturnForClient(err)
      })
    }),
  )

  router.get(
    '/active',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      return await getUserGames(user).catch(err => {
        throw BlackjackError.logAndReturnForClient(err)
      })
    }),
  )

  router.patch(
    '/:gameId/start',
    api.check,
    blackjack.checkStartCall,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const {
        user,
        body: { seats: seatRequests },
        params: { gameId },
      } = req as BlackjackStartGameRequest

      const canOverride =
        (config.isLocal || config.isStaging) && (user.staff ?? false)
      const createOpts = canOverride
        ? { hashOverride: req.body.hash }
        : undefined

      const seats: UserSeatRequest[] = seatRequests.map(seat => ({
        user,
        seatIndex: seat.seatIndex,
        clientSeed: seat.clientSeed,
        wagers: seat.wagers.map(wager => ({
          type: wager.type,
          amount: wager.amount,
          handIndex: wager.handIndex,
          sides: wager.sides?.map(side => ({
            type: side.type,
            amount: side.amount,
            outcome: WagerOutcomeType.Unknown,
          })),
        })),
      }))
      return await startUserGame(gameId, seats, createOpts).catch(err => {
        throw BlackjackError.logAndReturnForClient(err)
      })
    }),
  )

  router.get(
    '/:gameId',
    api.check,
    blackjack.checkGameId,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const {
        user,
        params: { gameId },
      } = req as RoobetReq

      return await getUserGame(gameId, user).catch(err => {
        throw BlackjackError.logAndReturnForClient(err)
      })
    }),
  )

  router.post(
    '/:gameId/hit',
    api.check,
    blackjack.checkHandAction(HandActionType.Hit),
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const {
        user,
        body: { handIndex },
        params: { gameId },
      } = req as BlackjackActionRequest

      return await hitUserGame(gameId, user, handIndex).catch(err => {
        throw BlackjackError.logAndReturnForClient(err)
      })
    }),
  )

  router.post(
    '/:gameId/stand',
    api.check,
    blackjack.checkHandAction(HandActionType.Stand),
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const {
        user,
        body: { handIndex },
        params: { gameId },
      } = req as BlackjackActionRequest

      return await standUserGame(gameId, user, handIndex).catch(err => {
        throw BlackjackError.logAndReturnForClient(err)
      })
    }),
  )

  router.post(
    '/:gameId/insure',
    api.check,
    blackjack.checkHandAction(HandActionType.Insurance),
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const {
        user,
        body: { handIndex, accept },
        params: { gameId },
      } = req as BlackjackInsureRequest

      return await insureUserGame(gameId, user, handIndex, accept).catch(
        err => {
          throw BlackjackError.logAndReturnForClient(err)
        },
      )
    }),
  )

  router.post(
    '/:gameId/doubleDown',
    api.check,
    blackjack.checkHandAction(HandActionType.DoubleDown),
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const {
        user,
        body: { handIndex },
        params: { gameId },
      } = req as BlackjackActionRequest

      return await doubleDownUserGame(gameId, user, handIndex).catch(err => {
        throw BlackjackError.logAndReturnForClient(err)
      })
    }),
  )

  router.post(
    '/:gameId/split',
    api.check,
    blackjack.checkHandAction(HandActionType.Split),
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const {
        user,
        body: { handIndex },
        params: { gameId },
      } = req as BlackjackActionRequest

      return await splitUserGame(gameId, user, handIndex).catch(err => {
        throw BlackjackError.logAndReturnForClient(err)
      })
    }),
  )
}
