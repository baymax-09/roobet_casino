import express from 'express'

import { api } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { houseGameHistoryBets } from '../lib/game_history_bets'

export default function (app: express.Router) {
  const router = express.Router()
  app.use('/admin', router)

  router.post(
    '/gamehistory',
    api.validatedApiCall(async req => {
      const { limit, page, sortObj, filterObj } = req.body
      const sort = sortObj ?? { timestamp: -1 }

      if (filterObj.userId) {
        return await houseGameHistoryBets(limit, page, sort, filterObj)
      } else {
        throw new APIValidationError('Must apply a filter to the table')
      }
    }),
  )
}
