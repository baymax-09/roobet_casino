import { config } from 'src/system'
import { BasicCache } from 'src/util/redisModels'
import {
  type DisplayCurrency,
  isDisplayCurrency,
} from 'src/modules/user/types/DisplayCurrency'

import { makeHacksawRequest, type HacksawStatusResponse } from './api'

interface HacksawCurrencyPair {
  currencyCode: string
  multiplier: number
}

interface CurrencyResponse extends HacksawStatusResponse {
  data: HacksawCurrencyPair[]
}

export const getAvailableCurrencies = async () => {
  return await BasicCache.cached('hacksaw', 'currencies', 60 * 60, async () => {
    const response = await makeHacksawRequest<CurrencyResponse>({
      path: `v1/meta/${config.hacksaw.partnerId}/currencies`,
      method: 'GET',
    })

    return response?.data.map(currencyPair =>
      currencyPair.currencyCode.toLowerCase(),
    )
  })
}

export const displayCurrencyToAccountCurrency = (
  displayCurrency: DisplayCurrency,
): string => {
  return displayCurrency.toUpperCase()
}

export const requestCurrencyHandler = (
  toConvert: string,
): DisplayCurrency | null => {
  const requestCurrency = toConvert.toLowerCase()
  if (!requestCurrency || !isDisplayCurrency(requestCurrency)) {
    return null
  }
  return requestCurrency
}
