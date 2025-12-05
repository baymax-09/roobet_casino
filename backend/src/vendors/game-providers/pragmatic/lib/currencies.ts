import {
  type DisplayCurrency,
  isDisplayCurrency,
} from 'src/modules/user/types/DisplayCurrency'

export const PRAGMATIC_CURRENCIES = [
  'AED',
  'AFN',
  'ALL',
  'AMD',
  'ANG',
  'AOA',
  'ARS',
  'AUD',
  'AWG',
  'AZN',
  'BAM',
  'BBD',
  'BDT',
  'BGN',
  'BHD',
  'BIF',
  'BMD',
  'BND',
  'BOB',
  'BRL',
  'BSD',
  'BTN',
  'BWP',
  'BYN',
  'BYR',
  'BZD',
  'CAD',
  'CDF',
  'CHF',
  'COP',
  'CLF',
  'CVE',
  'CLP',
  'DAS',
  'CNY',
  'DKK',
  'CRC',
  'DZD',
  'CUC',
  'EGP',
  'CUP',
  'ETB',
  'CZK',
  'FJD',
  'DJF',
  'GBP',
  'DOP',
  'GGP',
  'EEK',
  'GIP',
  'ERN',
  'GNF',
  'EUR',
  'GYD',
  'FKP',
  'HNL',
  'GEL',
  'HTG',
  'GHS',
  'IDR',
  'GMD',
  'IMP',
  'GTQ',
  'IQD',
  'HKD',
  'ISK',
  'HRK',
  'JMD',
  'HUF',
  'JPY',
  'ILS',
  'KGS',
  'INR',
  'KMF',
  'IRR',
  'KRW',
  'JEP',
  'KYD',
  'JOD',
  'LAK',
  'KES',
  'LKR',
  'KHR',
  'LSL',
  'KPW',
  'LYD',
  'KWD',
  'MDL',
  'KZT',
  'MKD',
  'LBP',
  'MNT',
  'LRD',
  'MRO',
  'LTL',
  'MUR',
  'MAD',
  'MWK',
  'MGA',
  'MYR',
  'MMK',
  'NAD',
  'MOP',
  'NIO',
  'MTL',
  'NPR',
  'MVR',
  'OMR',
  'MXN',
  'PEN',
  'MZN',
  'PHP',
  'NGN',
  'PLN',
  'NOK',
  'QAR',
  'NZD',
  'RSD',
  'PAB',
  'RWF',
  'PGK',
  'SBD',
  'PKR',
  'SDG',
  'PYG',
  'SGD',
  'RON',
  'SLL',
  'RUB',
  'SRD',
  'SAR',
  'SVC',
  'SCR',
  'SZL',
  'SEK',
  'TJS',
  'SHP',
  'TND',
  'SOS',
  'TRY',
  'STD',
  'TZS',
  'SYP',
  'UGX',
  'THB',
  'UYU',
  'TMT',
  'VES',
  'TOP',
  'VUV',
  'TTD',
  'XAF',
  'TWD',
  'XAU',
  'UAH',
  'XDR',
  'USD',
  'XOF',
  'UZS',
  'XPF',
  'VND',
  'YER',
  'WST',
  'ZMK',
  'XAG',
  'ZWL',
  'XCD',
  'XMR',
  'XPD',
  'XPT',
  'ZAR',
  'ZMW',
] as const
type PragmaticCurrency = (typeof PRAGMATIC_CURRENCIES)[number]
const isPragmaticCurrency = (value: any): value is PragmaticCurrency =>
  PRAGMATIC_CURRENCIES.includes(value)

export const checkIfCurrencySupported = (currency: DisplayCurrency) => {
  const upperCaseCurrency = currency.toUpperCase()
  return isPragmaticCurrency(upperCaseCurrency)
}

export const displayCurrencyToCurrencyCode = (toConvert: string): string => {
  return toConvert.toUpperCase()
}

export const currencyCodeToDisplayCurrency = (toConvert: string): string => {
  return toConvert.toLowerCase()
}

export const displayCurrencyFromRequestCurrency = (
  currency?: any,
): DisplayCurrency | null => {
  if (!currency || typeof currency !== 'string') {
    return null
  }
  const requestCurrency = currency.toLowerCase()
  if (!isDisplayCurrency(requestCurrency)) {
    return null
  }
  return requestCurrency
}

export const createPragId = (id: string, currency: DisplayCurrency) => {
  const displayCurrencyCode = displayCurrencyToCurrencyCode(currency)
  return `${id}_${displayCurrencyCode}`
}

export const parseUserIdFromPragId = (pragId: string): string => {
  const match = pragId.match(/^([0-9A-F-]+)(_[A-Z]{3})?$/i)
  if (match) {
    return match[1]
  }
  return pragId
}

export const parseCurrencyFromPragId = (pragId: string): string => {
  const match = pragId.match(/^[0-9A-F-]+_([A-Z]{3})$/i)
  if (match) {
    return match[1]
  }
  return 'USD'
}
