import { CryptoSymbolList } from 'src/modules/crypto/types'
import { type CurrencyPair } from 'src/modules/currency/documents/exchange_rates'
import { type CashCurrency } from '../../types'

export interface ExchangeRatesArgs {
  currencyPairs: CurrencyPair[]
  mainCurrency: CashCurrency
}

export const relativeChange = (initial: number, final: number) =>
  Math.abs((final - initial) / initial)

export function isValidSymbol<T>(currencyList: T[], symbol?: any): symbol is T {
  return currencyList.includes(symbol)
}

export const CryptoExchangeList = CryptoSymbolList.map(token => token)
