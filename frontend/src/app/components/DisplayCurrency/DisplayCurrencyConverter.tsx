import React from 'react'

import { useCurrencyFormatter } from 'app/hooks'

interface CurrencyConversionProps {
  amount: number
  format?: string
}

export const Currency: React.FC<CurrencyConversionProps> = ({
  amount,
  format,
}) => {
  const exchangeAndFormat = useCurrencyFormatter()
  const displayCurrency = exchangeAndFormat(amount, format)

  return <>{displayCurrency}</>
}
