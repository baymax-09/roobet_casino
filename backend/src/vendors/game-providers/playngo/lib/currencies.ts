import {
  type DisplayCurrency,
  isDisplayCurrency,
} from 'src/modules/user/types/DisplayCurrency'

export const PLAY_N_GO_CURRENCIES = [
  'AFN',
  'ALL',
  'DZD',
  'AOA',
  'ARS',
  'AMD',
  'AWG',
  'AUD',
  'AZN',
  'BSD',
  'BHD',
  'BDT',
  'BBD',
  'BYN',
  'BZD',
  'BMD',
  'BTN',
  'BOB',
  'BAM',
  'BWP',
  'BRL',
  'GBP',
  'BND',
  'BGN',
  'BIF',
  'KHR',
  'CAD',
  'CVE',
  'KYD',
  'XAF',
  'XPF',
  'CLP',
  'CNY',
  'COP',
  'KMF',
  'CDF',
  'CRC',
  'HRK',
  'CUP',
  'CZK',
  'DKK',
  'DJF',
  'DOP',
  'XCD',
  'EGP',
  'ERN',
  'ETB',
  'EUR',
  'FKP',
  'FJD',
  'GMD',
  'GEL',
  'GHS',
  'GIP',
  'GTQ',
  'GNF',
  'GYD',
  'HTG',
  'HNL',
  'HKD',
  'HUF',
  'ISK',
  'INR',
  'IDR',
  'IRR',
  'IQD',
  'ILS',
  'JMD',
  'JPY',
  'JOD',
  'KZT',
  'KES',
  'KDR',
  'KVD',
  'KWD',
  'KGS',
  'LAK',
  'LBP',
  'LSL',
  'LRD',
  'LYD',
  'MOP',
  'MKD',
  'MGA',
  'MWK',
  'MYR',
  'MVR',
  'MRO',
  'MUR',
  'MXN',
  'MBC',
  'UBC',
  'MDL',
  'MNT',
  'MAD',
  'MZN',
  'MMK',
  'NAD',
  'NPR',
  'ANG',
  'NZD',
  'NIO',
  'NGN',
  'KPW',
  'NOK',
  'OMR',
  'PKR',
  'PAB',
  'PGK',
  'PYG',
  'PEN',
  'PHP',
  'PLN',
  'QAR',
  'RON',
  'RUB',
  'RWF',
  'SHP',
  'WST',
  'STD',
  'SAR',
  'RSD',
  'SCR',
  'SLL',
  'SGD',
  'SBD',
  'SOS',
  'ZAR',
  'KRW',
  'LKR',
  'SDG',
  'SRD',
  'SZL',
  'SEK',
  'CHF',
  'SYP',
  'TWD',
  'TJS',
  'TZS',
  'THB',
  'TOP',
  'TTD',
  'TND',
  'TRY',
  'TMT',
  'AED',
  'UGX',
  'UAH',
  'UYU',
  'USD',
  'UZS',
  'VUV',
  'VEF',
  'XOF',
  'VND',
  'YER',
  'ZMW',
] as const
type PlayNGoCurrency = (typeof PLAY_N_GO_CURRENCIES)[number]
const isPlayNGoCurrency = (value: any): value is PlayNGoCurrency =>
  PLAY_N_GO_CURRENCIES.includes(value)

export const checkIfCurrencySupported = (currency: DisplayCurrency) => {
  const upperCaseCurrency = currency.toUpperCase()
  if (!isPlayNGoCurrency(upperCaseCurrency)) {
    return false
  }
  return PLAY_N_GO_CURRENCIES.includes(upperCaseCurrency)
}

export const displayCurrencyToCurrencyCode = (toConvert: string) => {
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

export const createPNGId = (id: string, currency: DisplayCurrency) => {
  const displayCurrencyCode = displayCurrencyToCurrencyCode(currency)
  return `${id}_${displayCurrencyCode}`
}

export const parsePNGId = (PNGid: string) => {
  const match = PNGid.match(/^([0-9A-F-]+)_[A-Z]{3}$/i)
  return match ? match[1] : null
}
