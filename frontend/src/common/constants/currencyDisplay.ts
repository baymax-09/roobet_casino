import dollarIcon_usd from 'assets/images/icons/currency/dollarIcon_usd.svg'
import dollarIcon_cad from 'assets/images/icons/currency/dollarIcon_cad.svg'
import dollarIcon_mxn from 'assets/images/icons/currency/dollarIcon_mxn.svg'
import euroIcon from 'assets/images/icons/currency/euroIcon.svg'
import br_real_icon from 'assets/images/icons/currency/br_real_icon.svg'
import kronaIcon from 'assets/images/icons/currency/kronaIcon.svg'
import pesoIcon from 'assets/images/icons/currency/pesoIcon.svg'
import rublesIcon from 'assets/images/icons/currency/rublesIcon.svg'
import rupeeIcon from 'assets/images/icons/currency/rupeesIcon.svg'
import rupiahIcon from 'assets/images/icons/currency/rupiahIcon.svg'
import wonIcon from 'assets/images/icons/currency/wonIcon.svg'
import yenIcon from 'assets/images/icons/currency/yenIcon.svg'
import yuanIcon from 'assets/images/icons/currency/yuanIcon.svg'
import argentinePesoIcon from 'assets/images/icons/currency/argentinePesoIcon.svg'
import turkishLiraIcon from 'assets/images/icons/currency/turkishLiraIcon.svg'

export const CurrencyIconMap: Record<DisplayCurrency, string> = {
  usd: dollarIcon_usd,
  cad: dollarIcon_cad,
  jpy: yenIcon,
  brl: br_real_icon,
  rub: rublesIcon,
  dkk: kronaIcon,
  mxn: dollarIcon_mxn,
  eur: euroIcon,
  cny: yuanIcon,
  inr: rupeeIcon,
  krw: wonIcon,
  php: pesoIcon,
  idr: rupiahIcon,
  ars: argentinePesoIcon,
  try: turkishLiraIcon,
}
export const CurrencyArray = Object.keys(CurrencyIconMap)

export const DisplayCurrencies = [
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

export const CashCurrencySymbols: Record<DisplayCurrency, string> = {
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
  ars: 'ARS ',
  try: 'TRY ',
}

export type DisplayCurrency = (typeof DisplayCurrencies)[number]
export const isDisplayCurrency = (value: any): value is DisplayCurrency =>
  DisplayCurrencies.includes(value)
