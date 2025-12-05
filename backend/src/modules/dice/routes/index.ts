import express from 'express'

import { api, type RouterApp, type RoobetReq } from 'src/util/api'

import { diceRoll } from '../lib/roll'
import { validateRollInputs } from './input_validation'
import { DiceModes } from '../lib/dice_modes'
import { acquireHouseGameRoundLock } from 'src/modules/game'
import { APIValidationError } from 'src/util/errors'
import { config } from 'src/system'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/dice', router)

  router.get(
    '/gameboard',
    api.validatedApiCall(async () => {
      return {
        edge: config.dice.edge,
        minBet: config.dice.minBet,
        maxBet: config.dice.maxBet,
        maxProfit: config.bet.maxProfit,
      }
    }),
  )

  router.post(
    '/roll',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq

      const roundLock = await acquireHouseGameRoundLock('dice', user.id)

      if (!roundLock) {
        throw new APIValidationError('slow_down')
      }

      try {
        const {
          clientSeed,
          amount,
          targetNumber,
          targetNumberEnd,
          targetNumber2,
          targetNumberEnd2,
          rollOver,
          autobet = false,
          freeBetItemId,
          mode,
          balanceDelay,
        } = req.body

        const parsedRollOver = rollOver === 'true' || rollOver === true

        let diceMode = mode
        if (!DiceModes.includes(mode)) {
          diceMode = parsedRollOver ? 'over' : 'under' // This is for backwards compatibility
        }

        validateRollInputs(
          clientSeed,
          amount,
          diceMode,
          targetNumber,
          targetNumberEnd,
          targetNumber2,
          targetNumberEnd2,
          balanceDelay,
        )

        const balanceUpdateDelayMS = balanceDelay ? Number(balanceDelay) : 0
        const balanceUpdateTimestamp = new Date(
          Date.now() + balanceUpdateDelayMS,
        )

        const parsedTargetNumber = parseFloat(
          parseFloat(targetNumber).toFixed(2),
        )
        const parsedTargetNumberEnd = parseFloat(
          parseFloat(targetNumberEnd).toFixed(2),
        )
        const parsedTargetNumber2 = parseFloat(
          parseFloat(targetNumber2).toFixed(2),
        )
        const parsedTargetNumberEnd2 = parseFloat(
          parseFloat(targetNumberEnd2).toFixed(2),
        )

        const rollResult = await diceRoll(
          user,
          parseFloat(amount),
          diceMode,
          parsedTargetNumber,
          parsedTargetNumberEnd,
          parsedTargetNumber2,
          parsedTargetNumberEnd2,
          clientSeed,
          { autobet },
          freeBetItemId,
          balanceUpdateTimestamp,
        )

        return rollResult
      } finally {
        await roundLock.release()
      }
    }),
  )
}
