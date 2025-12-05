import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'

import * as KYC from 'src/modules/fraud/kyc'
import { type User } from 'src/modules/user/types'

import {
  type PaymentMethod,
  type PaymentIQTransactionType,
  type PaymentProvider,
  type VerifyUserResponse,
} from '../types'
import { type ErrorMapItem, errorMap } from '../constants'
import { type APIValidationError } from 'src/util/errors'
import { piqLogger } from './logger'

export function parsePaymentMethod(
  paymentMethod: PaymentMethod,
): PaymentIQTransactionType {
  const lowercaseMethod = paymentMethod.toLowerCase()
  if (lowercaseMethod.includes('deposit')) {
    return 'deposit'
  }

  if (lowercaseMethod.includes('withdrawal')) {
    return 'withdrawal'
  }

  return 'unknown'
}

export const getDefaultAuthorizeAndTransferResponse = (userId: string) => {
  const authCode = uuidv4()

  return {
    userId,
    success: false,
    merchantTxId: '',
    authCode,
  }
}

export const generateUnsuccessfulResponse = ({
  userId,
  externalId,
  merchantTxId = '',
  error = errorMap.UNKNOWN_ERROR,
}: {
  userId: string
  externalId: string
  merchantTxId?: string
  error?: { errCode: string; errMsg: string }
}) => {
  const { errCode, errMsg } = error

  const unsuccessfulResponse = {
    ...getDefaultAuthorizeAndTransferResponse(userId),
    txId: externalId,
    merchantTxId,
    errCode,
    errMsg,
  }

  if (error === errorMap.UNKNOWN_ERROR) {
    piqLogger('generateUnsuccessfulResponse', { userId }).error(
      'paymentIq an unknown error occured',
      { unsuccessfulResponse },
    )
  }

  return unsuccessfulResponse
}
/** This function is only used to map to essentialValidation errors add more if needed */
export const mapAPIErrorsToPIQErrors = (apiError: APIValidationError) => {
  if (apiError.message.includes('This exceeds your howie deal')) {
    return errorMap.WITHDRAWAL_HOWIE_DEAL_EXCEED
  }
  switch (apiError.message) {
    case 'withdrawal__verify_email':
      return errorMap.WITHDRAWAL_VERIFY_EMAIL
    case 'max_withdraw_error':
      return errorMap.WITHDRAWAL_MAX_WITHDRAW
    case 'not_enough_balance':
      return errorMap.WITHDRAWAL_INSUFFICIENT_FUNDS
    case 'withdrawal__daily_allowance':
      return errorMap.WITHDRAWAL_DAILY_ALLOWANCE
    case 'withdrawal__match_promo':
      return errorMap.WITHDRAWAL_MATCH_PROMO
    case 'action__disabled':
      return errorMap.ACTION_DISABLED
    case 'deposit__convertedWager_requirement':
      return errorMap.WITHDRAWAL_DEPOSIT_WAGER_REQUIREMENT
    default:
      return errorMap.UNEXPECTED_WITHDRAWAL_ERROR
  }
}

export const txAmountToNumber = (txAmount: string): number => {
  const amount = Number(parseFloat(txAmount).toFixed(2)) || 0.0
  return Math.abs(amount)
}

export async function buildUpdatedUserFields(
  user: User,
  provider: PaymentProvider,
): Promise<Partial<VerifyUserResponse>> {
  const { dob, phone } = await KYC.getKycForUser(user)

  const res: Partial<VerifyUserResponse> = {
    userCat: user.role ?? 'Normal',
    mobile: phone,
  }

  if (provider === 'AstroPayCard') {
    return res
  }

  if (['BestPay', 'SaltarPay'].includes(provider)) {
    const dobMoment = moment(dob, 'DD/MM/YYYY')
    res.dob = dobMoment ? dobMoment.format('YYYY-MM-DD') : ''
    return res
  }

  if (provider === 'Skrill') {
    const dobMoment = moment(dob, 'DD/MM/YYYY')
    res.dob = dobMoment ? dobMoment.format('DDMMYYYY') : ''
    res.mobile = phone ? phone.replace(/\+/g, '') : ''
    return res
  }

  res.dob = dob
  return res
}

export const formatPIQErrorMessage = (message: string): ErrorMapItem => {
  return message === 'kyc__needed'
    ? errorMap.USER_KYC_LEVEL_NOT_ALLOWED
    : errorMap.UNKNOWN_ERROR
}

const CountryCodeMap: Record<string, string> = {
  AF: 'AFG',
  AX: 'ALA',
  AL: 'ALB',
  DZ: 'DZA',
  AS: 'ASM',
  AD: 'AND',
  AO: 'AGO',
  AI: 'AIA',
  AQ: 'ATA',
  AG: 'ATG',
  AR: 'ARG',
  AM: 'ARM',
  AW: 'ABW',
  AU: 'AUS',
  AT: 'AUT',
  AZ: 'AZE',
  BS: 'BHS',
  BH: 'BHR',
  BD: 'BGD',
  BB: 'BRB',
  BY: 'BLR',
  BE: 'BEL',
  BZ: 'BLZ',
  BJ: 'BEN',
  BM: 'BMU',
  BT: 'BTN',
  BO: 'BOL',
  BA: 'BIH',
  BW: 'BWA',
  BV: 'BVT',
  BR: 'BRA',
  VG: 'VGB',
  IO: 'IOT',
  BN: 'BRN',
  BG: 'BGR',
  BF: 'BFA',
  BI: 'BDI',
  KH: 'KHM',
  CM: 'CMR',
  CA: 'CAN',
  CV: 'CPV',
  KY: 'CYM',
  CF: 'CAF',
  TD: 'TCD',
  CL: 'CHL',
  CN: 'CHN',
  HK: 'HKG',
  MO: 'MAC',
  CX: 'CXR',
  CC: 'CCK',
  CO: 'COL',
  KM: 'COM',
  CG: 'COG',
  CD: 'COD',
  CK: 'COK',
  CR: 'CRI',
  CI: 'CIV',
  HR: 'HRV',
  CU: 'CUB',
  CY: 'CYP',
  CZ: 'CZE',
  DK: 'DNK',
  DJ: 'DJI',
  DM: 'DMA',
  DO: 'DOM',
  EC: 'ECU',
  EG: 'EGY',
  SV: 'SLV',
  GQ: 'GNQ',
  ER: 'ERI',
  EE: 'EST',
  ET: 'ETH',
  FK: 'FLK',
  FO: 'FRO',
  FJ: 'FJI',
  FI: 'FIN',
  FR: 'FRA',
  GF: 'GUF',
  PF: 'PYF',
  TF: 'ATF',
  GA: 'GAB',
  GM: 'GMB',
  GE: 'GEO',
  DE: 'DEU',
  GH: 'GHA',
  GI: 'GIB',
  GR: 'GRC',
  GL: 'GRL',
  GD: 'GRD',
  GP: 'GLP',
  GU: 'GUM',
  GT: 'GTM',
  GG: 'GGY',
  GN: 'GIN',
  GW: 'GNB',
  GY: 'GUY',
  HT: 'HTI',
  HM: 'HMD',
  VA: 'VAT',
  HN: 'HND',
  HU: 'HUN',
  IS: 'ISL',
  IN: 'IND',
  ID: 'IDN',
  IR: 'IRN',
  IQ: 'IRQ',
  IE: 'IRL',
  IM: 'IMN',
  IL: 'ISR',
  IT: 'ITA',
  JM: 'JAM',
  JP: 'JPN',
  JE: 'JEY',
  JO: 'JOR',
  KZ: 'KAZ',
  KE: 'KEN',
  KI: 'KIR',
  KP: 'PRK',
  KR: 'KOR',
  KW: 'KWT',
  KG: 'KGZ',
  LA: 'LAO',
  LV: 'LVA',
  LB: 'LBN',
  LS: 'LSO',
  LR: 'LBR',
  LY: 'LBY',
  LI: 'LIE',
  LT: 'LTU',
  LU: 'LUX',
  MK: 'MKD',
  MG: 'MDG',
  MW: 'MWI',
  MY: 'MYS',
  MV: 'MDV',
  ML: 'MLI',
  MT: 'MLT',
  MH: 'MHL',
  MQ: 'MTQ',
  MR: 'MRT',
  MU: 'MUS',
  YT: 'MYT',
  MX: 'MEX',
  FM: 'FSM',
  MD: 'MDA',
  MC: 'MCO',
  MN: 'MNG',
  ME: 'MNE',
  MS: 'MSR',
  MA: 'MAR',
  MZ: 'MOZ',
  MM: 'MMR',
  NA: 'NAM',
  NR: 'NRU',
  NP: 'NPL',
  NL: 'NLD',
  AN: 'ANT',
  NC: 'NCL',
  NZ: 'NZL',
  NI: 'NIC',
  NE: 'NER',
  NG: 'NGA',
  NU: 'NIU',
  NF: 'NFK',
  MP: 'MNP',
  NO: 'NOR',
  OM: 'OMN',
  PK: 'PAK',
  PW: 'PLW',
  PS: 'PSE',
  PA: 'PAN',
  PG: 'PNG',
  PY: 'PRY',
  PE: 'PER',
  PH: 'PHL',
  PN: 'PCN',
  PL: 'POL',
  PT: 'PRT',
  PR: 'PRI',
  QA: 'QAT',
  RE: 'REU',
  RO: 'ROU',
  RU: 'RUS',
  RW: 'RWA',
  BL: 'BLM',
  SH: 'SHN',
  KN: 'KNA',
  LC: 'LCA',
  MF: 'MAF',
  PM: 'SPM',
  VC: 'VCT',
  WS: 'WSM',
  SM: 'SMR',
  ST: 'STP',
  SA: 'SAU',
  SN: 'SEN',
  RS: 'SRB',
  SC: 'SYC',
  SL: 'SLE',
  SG: 'SGP',
  SK: 'SVK',
  SI: 'SVN',
  SB: 'SLB',
  SO: 'SOM',
  ZA: 'ZAF',
  GS: 'SGS',
  SS: 'SSD',
  ES: 'ESP',
  LK: 'LKA',
  SD: 'SDN',
  SR: 'SUR',
  SJ: 'SJM',
  SZ: 'SWZ',
  SE: 'SWE',
  CH: 'CHE',
  SY: 'SYR',
  TW: 'TWN',
  TJ: 'TJK',
  TZ: 'TZA',
  TH: 'THA',
  TL: 'TLS',
  TG: 'TGO',
  TK: 'TKL',
  TO: 'TON',
  TT: 'TTO',
  TN: 'TUN',
  TR: 'TUR',
  TM: 'TKM',
  TC: 'TCA',
  TV: 'TUV',
  UG: 'UGA',
  UA: 'UKR',
  AE: 'ARE',
  GB: 'GBR',
  US: 'USA',
  UM: 'UMI',
  UY: 'URY',
  UZ: 'UZB',
  VU: 'VUT',
  VE: 'VEN',
  VN: 'VNM',
  VI: 'VIR',
  WF: 'WLF',
  EH: 'ESH',
  YE: 'YEM',
  ZM: 'ZMB',
  ZW: 'ZWE',
  XK: 'XKX',
}

export function getCountryCode(countryCode: string): string | undefined {
  return CountryCodeMap[countryCode]
}
