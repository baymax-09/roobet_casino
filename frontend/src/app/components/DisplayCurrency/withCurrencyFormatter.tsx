import React from 'react'

import {
  useCurrencyFormatter,
  useCurrencyDisplay,
  useSelectedCurrency,
  useCurrencyUnexchange,
} from 'app/hooks'

export const withCurrencyHooks = <T extends object>(
  Component: React.ComponentType<T>,
): React.ComponentType<
  T & {
    currencyFormatter: any
    displayCurrencyExchange: any
    selectedCurrency: any
    currencyUnexchange: any
  }
> => {
  const currencyFormatter = useCurrencyFormatter
  const displayCurrencyExchange = useCurrencyDisplay
  const fetchSelectedCurrency = useSelectedCurrency
  const unexchangeCurrency = useCurrencyUnexchange

  return (props: T) => (
    <Component
      {...props}
      currencyFormatter={currencyFormatter()}
      displayCurrencyExchange={displayCurrencyExchange()}
      selectedCurrency={fetchSelectedCurrency()}
      currencyUnexchange={unexchangeCurrency()}
    />
  )
}
