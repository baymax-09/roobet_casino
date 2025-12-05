import {
  type DisplayCurrency,
  isDisplayCurrency,
} from 'src/modules/user/types/DisplayCurrency'

import { isHub88Provider, type Hub88Provider } from './types'

export const hub88DemoCurrency = 'XXX' as const
export type Hub88DemoCurrency = typeof hub88DemoCurrency

export const HUB88_PROVIDER_UNSUPPORTED_CURRENCIES: Record<
  Hub88Provider,
  DisplayCurrency[]
> = {
  'Booming Games': ['try'],
  Microgaming: ['try'],
  'Blueprint Gaming': ['ars', 'try'],
  'Caleta Gaming': [],
  'Kalamba Games': ['try'],
  Habanero: [],
  'Green Jade': ['ars', 'try'],
  'Green Jade Arcade': ['ars', 'try'],
  MrSlotty: ['ars', 'try'],
  'Evoplay Entertainment': ['try'],
  Fugaso: ['ars', 'try'],
  EGT: ['ars', 'try'],
  BetsyGames: ['cad', 'dkk', 'mxn', 'php', 'idr', 'ars', 'try'],
  OneTouch: ['try'],
  'Bombay Live': ['ars', 'try'],
  'Red Rake Gaming': ['try'],
  Gamomat: ['jpy', 'dkk', 'cny', 'inr', 'krw', 'php', 'idr', 'ars', 'try'],
  'Golden Rock Studios': ['try'],
  Endorphina: [
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
  ],
  Octoplay: [
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
  ],
  Rogue: ['cad', 'brl', 'dkk', 'mxn', 'inr', 'krw', 'php', 'idr', 'ars', 'try'],
  Genii: ['inr', 'krw', 'php', 'idr', 'try'],
  LadyLuck: ['ars', 'try'],
  'Triple Edge': ['krw', 'try'],
  Stormcraft: ['krw', 'try'],
  Gameburger: ['krw', 'ars', 'try'],
  'SpinPlay Games': ['krw', 'try'],
  All41: ['krw', 'try'],
  'Alchemy Gaming': ['krw', 'try'],
  JFTW: ['krw', 'try'],
  'Neon Valley': ['krw', 'try'],
  'Snowborn Studios': ['krw', 'try'],
  Foxium: ['krw', 'try'],
  Slingshot: ['krw', 'try'],
  'Northern Lights Gaming': ['krw', 'try'],
  'Buck Stakes Entertainment': ['krw', 'try'],
  'Old Skool': ['krw', 'try'],
  'Gong Gaming': ['krw', 'ars', 'try'],
  'MG Slots': ['eur', 'try', 'jpy', 'inr', 'krw', 'rub', 'ars'],
  'MG Grand Live': ['eur', 'try', 'jpy', 'inr', 'krw', 'rub', 'ars'],
}

export const getUnsupportedCurrencies = (provider?: string) => {
  return isHub88Provider(provider)
    ? HUB88_PROVIDER_UNSUPPORTED_CURRENCIES[provider]
    : []
}

export const displayCurrencyToCurrencyCode = (toConvert: string): string => {
  return toConvert.toUpperCase()
}

export const getDisplayCurrencyFromRequest = ({
  currency,
}: {
  currency?: string
}): DisplayCurrency | null => {
  if (typeof currency !== 'string') {
    return null
  }
  const requestCurrency = currency.toLowerCase()
  if (!isDisplayCurrency(requestCurrency)) {
    return null
  }
  return requestCurrency
}
