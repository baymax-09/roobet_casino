import express from 'express'
import { getAvailableBalanceTypes } from 'src/modules/user/balance'

import { api, type RoobetReq, type RouterApp } from 'src/util/api'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/currency', router)

  router.get(
    '/balances',
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq

      const availableBalanceTypes = await getAvailableBalanceTypes(user)

      const balances = Object.fromEntries(
        Object.entries(availableBalanceTypes).map(([type, schema]) => {
          return [
            type,
            {
              ...schema,
              icon: `/images/balances/${type}.png`,
            },
          ]
        }),
      )

      return balances
    }),
  )
}
