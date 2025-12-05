import { updateCurrencyPair } from 'src/modules/currency/documents/exchange_rates'
import { scopedLogger } from 'src/system/logger'
import { fetchLiveExchangeRates } from 'src/vendors/fixer'

import { type CashCurrency } from '../../types'
import { CurrencyExchangeList } from '../../types/Currency'
import { isValidSymbol, relativeChange, type ExchangeRatesArgs } from './util'

interface FiatExchangeRateArgs extends ExchangeRatesArgs {
  inverseRate: number
  targetCurrency: CashCurrency
}

const currencyLogger = scopedLogger('currency')

const truncateExchangeRate = (exchangeRate: number): number => {
  if (exchangeRate < 0.0002) {
    return Math.floor(exchangeRate * Math.pow(10, 5)) / Math.pow(10, 5)
  }
  return Math.round(exchangeRate * Math.pow(10, 4)) / Math.pow(10, 4)
}

const updateFiatExchangeRate = async ({
  currencyPairs,
  mainCurrency: source,
  targetCurrency,
  inverseRate,
}: FiatExchangeRateArgs) => {
  if (!isValidSymbol<CashCurrency>(CurrencyExchangeList, targetCurrency)) {
    return
  }

  const logger = currencyLogger('updateFiatExchangeRate', { userId: null })

  // take the inverse of the rate returned from the API
  // because they send how much 1 source currency is in the target currency
  const rate = truncateExchangeRate(1 / inverseRate)
  const current = currencyPairs.find(
    pair => pair.targetCurrency === targetCurrency,
  )
  const averageRate = current?.exchangeRate || 0.0
  const change = relativeChange(averageRate, rate)
  const isNormalChange = change < 0.5

  if (isNormalChange || !current) {
    await updateCurrencyPair(source, targetCurrency, rate)
    logger.info(
      `Fiat exchange rate relative change: ${targetCurrency} ${change}x, ${current?.targetCurrency} -> ${rate}`,
    )
  } else {
    logger.alert('fiatExchangeRatesAnomaly', {
      change,
      targetCurrency,
      previousRate: averageRate,
      newRate: rate,
      sourceCurrency: 'usd',
    })
  }
}

export async function updateFiatExchangeRates({
  currencyPairs,
  mainCurrency: source,
}: ExchangeRatesArgs) {
  const targetCurrencies = CurrencyExchangeList.join(',')
  const fixerResponse = await fetchLiveExchangeRates({
    targetCurrencies,
    sourceCurrency: source,
  })

  if (!fixerResponse) {
    return
  }

  const { rates } = fixerResponse

  for (const targetCurrency of CurrencyExchangeList) {
    const inverseRate =
      rates[targetCurrency.toUpperCase() as Uppercase<CashCurrency>]
    await updateFiatExchangeRate({
      currencyPairs,
      mainCurrency: source,
      inverseRate,
      targetCurrency,
    })
  }
}
