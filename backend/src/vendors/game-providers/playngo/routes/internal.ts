import express from 'express'

import { config } from 'src/system'
import { api, type Router, type RoobetReq } from 'src/util/api'
import { getUserSelectedDisplayCurrency } from 'src/modules/currency/lib/currencyFormat'

import { generateAuthToken } from '../lib/auth'
import { checkIfCurrencySupported } from '../lib/currencies'

export default function (app: Router) {
  const router = express.Router()
  app.use('/internal', router)

  router.get(
    '/getGameConfig',
    api.check,
    api.asyncCallback(async (req, res) => {
      const { user } = req as RoobetReq
      const token = generateAuthToken(user, true)
      const displayCurrency = await getUserSelectedDisplayCurrency(user.id)
      const unsupportedPlayNGoCurrency =
        !checkIfCurrencySupported(displayCurrency)

      res.json({
        token,
        ...(unsupportedPlayNGoCurrency && {
          supportedCurrencies:
            config.displayCurrencies.filter(displayCurrency =>
              checkIfCurrencySupported(displayCurrency),
            ) ?? [],
        }),
      })
    }),
  )
}
