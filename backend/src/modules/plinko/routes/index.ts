import express from 'express'

import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { countryIsBannedMiddleware } from 'src/modules/fraud/geofencing'

import { plinkoRoll } from '../lib/roll'
import { type RowNumber } from '../lib/payout_list'
import { RiskLevels, RowNumbers } from '../lib/payout_list'
import { getAllBoardInfo } from '../lib/fetch_current_payouts'
import { type RollResultResponse } from '../lib/roll'
import { LIGHTNING_BOARD_ROW_NUMBERS } from '../lib/lightning_board'
import { acquireHouseGameRoundLock } from 'src/modules/game'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/plinko', router)

  router.post(
    '/boardInfo',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async () => {
      return await getAllBoardInfo()
    }),
  )

  router.post(
    '/roll',
    api.check,
    countryIsBannedMiddleware,
    api.validatedApiCall(async function (req): Promise<RollResultResponse> {
      const { user } = req as RoobetReq

      const roundLock = await acquireHouseGameRoundLock('plinko', user.id)

      if (!roundLock) {
        throw new APIValidationError('slow_down')
      }

      try {
        let {
          clientSeed,
          amount,
          autobet,
          numberOfRows,
          riskLevel,
          balanceDelay,
        } = req.body

        if (!autobet) {
          autobet = false
        }

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

        if (!numberOfRows) {
          throw new APIValidationError('supply__numberOfRows')
        }

        if (!RowNumbers.includes(numberOfRows)) {
          throw new APIValidationError('invalid_numberOfRows')
        }

        if (!riskLevel) {
          throw new APIValidationError('supply__risk_level')
        }

        if (!RiskLevels.includes(riskLevel)) {
          throw new APIValidationError('invalid_risk_level')
        }

        if (
          riskLevel === 'lightning' &&
          numberOfRows !== LIGHTNING_BOARD_ROW_NUMBERS
        ) {
          throw new APIValidationError('invalid_numberOfRows')
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

        const balanceUpdateDelayMS = balanceDelay ? Number(balanceDelay) : 0
        const balanceUpdateTimestamp = new Date(
          Date.now() + balanceUpdateDelayMS,
        )

        return await plinkoRoll(
          user,
          clientSeed,
          parseFloat(amount),
          numberOfRows as RowNumber,
          riskLevel,
          autobet,
          balanceUpdateTimestamp,
        )
      } finally {
        roundLock.release()
      }
    }),
  )
}
