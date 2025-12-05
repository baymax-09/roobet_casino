import { CryptoSymbolList, type CryptoSymbol } from 'src/modules/crypto/types'
import {
  BalanceTypes,
  type BalanceType,
  type User,
} from 'src/modules/user/types'

export const DisplayCurrencyList = [
  'usd',
  'cad',
  'jpy',
  'brl',
  'rub',
  'dkk',
  'mxn',
  'eur',
  'cny',
  'inr',
  'krw',
  'php',
  'idr',
  'ars',
  'try',
] as const

export const CurrencyExchangeList = DisplayCurrencyList.filter(
  currency => currency !== 'usd',
)

export type CurrencyType = 'crypto' | 'cash'
export type CashCurrency = (typeof DisplayCurrencyList)[number]
export type Currency = CashCurrency | CryptoSymbol

const cryptoTypeMap = CryptoSymbolList.reduce(
  (acc, val) => {
    acc[val] = 'crypto'
    return acc
  },
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  {} as Record<CryptoSymbol, 'crypto'>,
)

const displayCurrencyTypeMap = DisplayCurrencyList.reduce(
  (acc, val) => {
    acc[val] = 'cash'
    return acc
  },
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  {} as Record<CashCurrency, 'cash'>,
)

export const CurrencyTypeMap: Record<Currency, CurrencyType> = {
  ...cryptoTypeMap,
  ...displayCurrencyTypeMap,
}

const balanceTypeToCurrencyMap = BalanceTypes.reduce(
  (acc, token) => {
    if (token === 'crypto') {
      acc[token] = 'btc'
      return acc
    }
    if (token === 'cash') {
      acc[token] = 'usd'
      return acc
    }
    acc[token] = token
    return acc
  },
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  {} as Record<BalanceType, Currency>,
)

export const cashCurrencySymbols: Record<CashCurrency, string> = {
  usd: '$',
  cad: 'C$',
  jpy: '¥',
  brl: 'R$',
  rub: '₽',
  dkk: 'kr',
  mxn: 'MX$',
  eur: '€',
  cny: '¥',
  inr: '₹',
  krw: '₩',
  php: '₱',
  idr: 'Rp',
  ars: 'ARS ', // space here is intentional as there is no symbol
  try: 'TRY ', // space here is intentional
}

export const getCurrencyFromBalanceType = (
  balanceType: BalanceType,
): Currency => {
  return balanceTypeToCurrencyMap[balanceType]
}

/**
 * Get the user's selected fiat currency. Always `USD` for now.
 * @param user The {@link User user} to get the selected fiat currency for.
 * @returns The selected fiat currency. Always `USD` for now.
 * @todo This is a copy of the function below that conforms to the types.
 * We use both in the codebase, we need to combine them.
 */
export const getUserSelectedFiatCurrency = (user: User): CashCurrency => {
  return 'usd'
}

/**
 * Get the user's selected fiat currency. Always `USD` for now.
 * @param userId The {@link User.id user id} to get the selected fiat currency for.
 * @returns The selected fiat currency. Always `USD` for now.
 * @todo This is a copy of the function above that uses `id`.
 * We use both in the codebase, we need to combine them.
 */
export const getUserFiatCurrency = (userId: string) => {
  return 'USD'
}
