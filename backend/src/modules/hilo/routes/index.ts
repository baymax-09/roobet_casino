import express from 'express'

import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'

import { hiloRoll } from '../lib/roll'
import { validateRollInputs } from './input_validation'
import { acquireHouseGameRoundLock } from 'src/modules/game'
import { APIValidationError } from 'src/util/errors'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/hilo', router)

  router.post(
    '/roll',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq

      const roundLock = await acquireHouseGameRoundLock('hilo', user.id)

      if (!roundLock) {
        throw new APIValidationError('slow_down')
      }

      try {
        const {
          clientSeed,
          amount,
          targetNumber,
          autobet = false,
          freeBetItemId,
          mode,
        } = req.body

        validateRollInputs(clientSeed, amount, mode, targetNumber)

        const parsedTargetNumber = parseFloat(
          parseFloat(targetNumber).toFixed(2),
        )

        const rollResult = await hiloRoll(
          user,
          parseFloat(amount),
          mode,
          parsedTargetNumber,
          clientSeed,
          { autobet },
          freeBetItemId,
        )

        return rollResult
      } finally {
        await roundLock.release()
      }
    }),
  )
}
