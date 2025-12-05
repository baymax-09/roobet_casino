import { getSystemSettings } from 'src/modules/userSettings'
import { type User } from 'src/modules/user/types'
import {
  isDisplayCurrency,
  type DisplayCurrency,
} from 'src/modules/user/types/DisplayCurrency'

import {
  type Currency,
  type CashCurrency,
  DisplayCurrencyList,
  cashCurrencySymbols,
} from '../types'
import {
  getCurrencyPairs,
  getCurrencyPair,
  getCurrencyPairsBySource,
} from '../documents/exchange_rates'

interface CurrencyExchangeRate {
  symbol: string
  rate: number
}

export const truncateCurrency = (amount: number, digits = 2): string => {
  const multiplier = Math.pow(10, digits)
  return (Math.floor(amount * multiplier) / multiplier).toFixed(digits)
}

export const getUserSelectedDisplayCurrency = async (
  userId?: string,
): Promise<DisplayCurrency> => {
  if (!userId) {
    return 'usd'
  }
  const systemSettings = await getSystemSettings(userId)
  const displayCurrency = systemSettings?.currency?.displayCurrency
  if (!isDisplayCurrency(displayCurrency)) {
    return 'usd'
  }
  return displayCurrency
}

type ExchangeRates = Record<CashCurrency, CurrencyExchangeRate>

const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  const selectedFiat = 'usd'
  const rates = await getCurrencyPairs(DisplayCurrencyList, selectedFiat)

  const exchangeRates = rates.reduce(
    (rates, rate) => ({
      ...rates,
      [rate.targetCurrency]: {
        rate: rate.exchangeRate,
        symbol: cashCurrencySymbols[rate.targetCurrency],
      },
    }),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    {} as ExchangeRates,
  )

  return exchangeRates
}

/**
 * Currency Exchange function for displayCurrency conversion.
 * converts a given amount to a users preffered displayCurrency.
 *
 * @param {number} amount - The amount to be converted.
 * @param {User} user - The user whose settings are referenced.
 * @param {boolean} symbol - Option to return only converted amount (no appended symbol), default true.
 * @param {DisplayCurrency} currency - Optional currency to use for conversion, defaults to users displayCurrency.
 * @returns {Promise<string>} - Promised string of the converted amount.
 */

export const exchangeAndFormatCurrency = async (
  amount: number,
  user: User,
  displaySymbol = true,
  currency?: string,
): Promise<string> => {
  const getAmountString = (
    displaySymbol: boolean,
    symbol: string,
    amount: number,
  ) => `${displaySymbol ? symbol : ''}${truncateCurrency(amount)}`

  const userDisplayCurrency = await getUserSelectedDisplayCurrency(user.id)

  const displayCurrency = (function resolveDisplayCurrency() {
    if (currency && isDisplayCurrency(currency)) {
      return currency
    }
    if (isDisplayCurrency(userDisplayCurrency)) {
      return userDisplayCurrency
    }
    return 'usd'
  })()

  if (displayCurrency === 'usd') {
    return getAmountString(displaySymbol, '$', amount)
  }

  const exchangeRates = await fetchExchangeRates()

  const selectedCurrency = exchangeRates[displayCurrency] || {
    symbol: '$',
    rate: 1,
  }
  const exchangedAmount = amount / selectedCurrency.rate

  return getAmountString(
    displaySymbol,
    selectedCurrency.symbol,
    exchangedAmount,
  )
}

/**
 * Currency Exchange function for use with DisplayCurrency system.
 * Converts a given amount to or from a given DisplayCurrency
 * Returned amount will be precise (not truncated).
 *
 * @param {number} amount - The USD amount to be converted.
 * @param {DisplayCurrency} currency - The non-USD currency to use for conversion, if USD is sent `amount` is directly returned.
 * @param {boolean} getDisplay - Option to convert to displayCurrency rather than from, default false.
 * @returns {Promise<number>} - Promised number of the converted amount.
 */

export const currencyExchange = async (
  amount: number,
  currency: DisplayCurrency,
  getDisplay = false,
): Promise<number> => {
  if (currency === 'usd') {
    return amount
  }

  const exchangeRates = await fetchExchangeRates()

  const selectedCurrency = exchangeRates[currency] || { symbol: '$', rate: 1 }
  const exchangedAmount = getDisplay
    ? amount / selectedCurrency.rate
    : amount * selectedCurrency.rate

  return exchangedAmount
}

/** convert USD to target currency */
export async function convertUserBalanceToCurrency(
  amount: number,
  currency: Currency,
) {
  if (amount === 0) {
    return 0
  }
  const currencyPair = await getCurrencyPair(currency, 'usd')
  return currencyPair?.exchangeRate ? amount / currencyPair.exchangeRate : 0
}

/** convert currency to USD */
export async function convertCurrencyToUserBalance(
  amount: number,
  currency: Currency,
) {
  if (amount === 0) {
    return 0
  }
  const currencyPair = await getCurrencyPair(currency, 'usd')
  return currencyPair?.exchangeRate ? amount * currencyPair.exchangeRate : 0
}

export async function convertSourceCurrenciesToUSD(
  sourceCurrencies: Currency[],
) {
  return await getCurrencyPairsBySource(sourceCurrencies, 'usd')
}
