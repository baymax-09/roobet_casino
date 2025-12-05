import React from 'react'
import numeral from 'numeral'
import { shallowEqual, useSelector } from 'react-redux'

import { roundBalance } from 'app/util'
import { isDisplayCurrency } from 'common/constants'

export type ExchangeAndFormatCurrency = (amount: number) => {
  currencySymbol: string
  exchangedAmount: number
}

export type ExchangeAndFormatCurrencyString = (
  amount: number,
  format?: string,
) => string

interface SelectedCurrency {
  symbol: string
  rate: number
}

const defaultSelectedCurrency = {
  symbol: '$',
  rate: 1,
}

function formatCurrency(amount: number, format = '0,0,0.00'): string {
  return numeral(roundBalance(amount)).format(format)
}

export const useCurrencyFormatter = (): ExchangeAndFormatCurrencyString => {
  const exchangeAndFormat = useCurrencyDisplay()

  return (amount, format) => {
    const { currencySymbol, exchangedAmount } = exchangeAndFormat(amount)
    // Want to avoid potential floating point arithmetic issues, and amount displaying as negative.
    const newExchangedAmount = exchangedAmount < 0.01 ? 0 : exchangedAmount
    return `${currencySymbol}${formatCurrency(newExchangedAmount, format)}`
  }
}

export const useCurrencyDisplay = (): ExchangeAndFormatCurrency => {
  const [displayCurrency, exchangeRates] = useSelector(({ user }) => {
    let displayCurrency = user?.systemSettings?.currency.displayCurrency
    if (!isDisplayCurrency(displayCurrency)) {
      displayCurrency = 'usd'
    }
    return [
      displayCurrency,
      user?.exchangeRates || {
        usd: defaultSelectedCurrency,
      },
    ] as const
  }, shallowEqual)

  const selectedCurrency =
    exchangeRates[displayCurrency] ?? defaultSelectedCurrency

  const exchange = React.useCallback(
    (amount: number) => {
      if (displayCurrency === 'usd') {
        return {
          currencySymbol: '$',
          exchangedAmount: amount,
        }
      }

      const convertedNumber = amount / selectedCurrency.rate

      return {
        currencySymbol: selectedCurrency.symbol,
        exchangedAmount: convertedNumber,
      }
    },
    [displayCurrency, selectedCurrency.rate, selectedCurrency.symbol],
  )

  return exchange
}

export const useSelectedCurrency = (): SelectedCurrency => {
  const [displayCurrency, exchangeRates] = useSelector(({ user }) => {
    let displayCurrency = user?.systemSettings?.currency.displayCurrency
    if (!isDisplayCurrency(displayCurrency)) {
      displayCurrency = 'usd'
    }

    return [
      displayCurrency,
      user?.exchangeRates || {
        usd: defaultSelectedCurrency,
      },
    ] as const
  }, shallowEqual)

  const selectedCurrency: SelectedCurrency = React.useMemo(() => {
    return exchangeRates[displayCurrency] || defaultSelectedCurrency
  }, [displayCurrency, exchangeRates])

  return selectedCurrency
}

export const useCurrencyUnexchange = (): ((amount: number) => number) => {
  const { rate } = useSelectedCurrency()

  const unexchange = React.useCallback(
    (amount: number) => {
      return amount * rate
    },
    [rate],
  )

  return unexchange
}
