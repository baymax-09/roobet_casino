import { queryField } from 'nexus'

import { getCurrencyPairsForTarget } from 'src/modules/currency/documents/exchange_rates'
import { type Currency } from 'src/modules/currency/types'

import { ExchangeRatesType } from '../types/exchangeRates'

export const ExchangeRatesQueryField = queryField('exchangeRates', {
  type: ExchangeRatesType,
  description: 'Fetches the list of currency prices in USD.',
  auth: {
    authenticated: true,
  },
  resolve: async () => {
    const targetCurrency = 'usd'
    const currencyPairs = await getCurrencyPairsForTarget(targetCurrency)

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const pairsObj = {} as Record<Currency, number>
    currencyPairs.forEach(pair => {
      pairsObj[pair.sourceCurrency] = pair.exchangeRate
    })

    return pairsObj
  },
})
