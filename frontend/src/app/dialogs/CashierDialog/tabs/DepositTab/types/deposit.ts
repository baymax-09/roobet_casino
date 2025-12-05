export const FiatCurrencyList = ['cad', 'mxn', 'usd'] as const
export const CryptoCurrencyList = ['btc', 'eth', 'ltc', 'bch'] as const

export type CurrencyType = 'crypto' | 'cash'
export type CashCurrency = (typeof FiatCurrencyList)[number]
export type CryptoCurrency = (typeof CryptoCurrencyList)[number]
export type Currency = CashCurrency | CryptoCurrency
