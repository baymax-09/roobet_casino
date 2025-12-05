import { type Action } from './Request'
import {
  type SeonEmailAccountDetails,
  type SeonPhoneAccountDetails,
} from './Account'

export enum RiskStatus {
  APPROVED = 'APPROVED',
  REVIEW = 'REVIEW',
  DECLINED = 'DECLINE',
}

export type ErrorCode =
  | '1000'
  | '1001'
  | '1002'
  | '1005'
  | '1006'
  | '1009'
  | '1014'
  | '2000'
  | '2001'
  | '2002'
  | '2003'
  | '2004'
  | '2006'
  | '3000'
  | '3001'
  | '3002'
  | '3003'
  | '3004'
  | '3005'

export const AppliedRules = [
  '1000496',
  '1000499',
  '1000500',
  '1000501',
  '1000502',
  '1000503',
] as const
export type AppliedRulesType = (typeof AppliedRules)[number]

type SeonAppliedRuleId = 'E100' | AppliedRulesType

interface SeonDomainDetails {
  domain: string
  tld: string
  created: string
  updated: string
  expires: string | null
  registered: boolean
  registrar_name: string | null
  registered_to: string | null
  disposable: boolean
  free: boolean
  custom: boolean
  dmarc_enforced: boolean
  spf_strict: boolean
  valid_mx: boolean
  accept_all: boolean
  suspicious_tld: boolean
  website_exists: boolean
}

interface SeonBreachDetails {
  breaches: Array<{
    name: string
    domain: string
    date: string
  }>
  haveibeenpwned_listed: boolean
  number_of_breaches: number | null
  first_breach: string | null
}

interface SeonHistoryDetails {
  hits: number
  customer_hits: number
  first_seen: number
  last_seen: number
}

interface SeonFlag {
  note: string
  date: number
  industry: string
}

export interface SeonIpDetails {
  id: string
  ip: string
  /** number from 1 to 100 */
  score: number
  country: string
  state_prov: string
  city: string
  timezone_offset: string
  isp_name: string
  latitude: number
  longitude: number
  type: string
  open_ports: number[]
  tor: boolean
  harmful: boolean
  vpn: boolean
  web_proxy: boolean
  public_proxy: boolean
  spam_number: number
  spam_urls: string[]
  history: SeonHistoryDetails
  flags: SeonFlag[]
}

interface SeonEmailDetails {
  id: string
  email: string
  /** number from 1 to 100 */
  score: number
  deliverable: boolean
  domain_details: SeonDomainDetails
  account_details: SeonEmailAccountDetails
  breach_details: SeonBreachDetails
  history: SeonHistoryDetails
  flags: SeonFlag[]
}

interface SeonBinDetails {
  card_bin: string
  bin_bank: string
  bin_card: string
  bin_type: string
  bin_level: string
  bin_country: string
  bin_countrycode: string
  bin_website: string
  bin_phone: string
  bin_valid: boolean
  card_issuer: string
}

interface SeonDeviceDetails {
  type: string
  source: string
  session_id: string
  adblock: boolean
  audio_hash: string
  battery_charging: boolean
  battery_level: number
  browser_hash: string
  browser: string
  browser_version: string
  canvas_hash: string
  cookie_enabled: boolean
  cookie_hash: string
  device_hash: string
  device_memory: number
  device_type: string
  dns_ip: string
  dns_ip_country: string
  dns_ip_isp: string
  do_not_track: boolean
  flash_enabled: boolean
  font_count: number
  font_hash: string
  font_list: string[]
  hardware_concurrency: number
  java_enabled: boolean
  device_ip_address: string
  device_ip_country: string
  device_ip_isp: string
  accept_language: string[]
  os: string
  platform: string
  plugin_count: number
  plugin_hash: string
  plugin_list: string[]
  private: boolean
  region_language: string
  region_timezone: string
  screen_available_resolution: string
  screen_color_depth: number
  screen_pixel_ratio: number
  screen_resolution: string
  touch_support: boolean
  user_agent: string
  webgl_hash: string
  webgl_vendor: string
  webrtc_activated: boolean
  webrtc_count: number
  webrtc_ips: string[]
  window_size: string
}

interface SeonPhoneDetails {
  number: number
  valid: boolean
  type: string
  country: string
  carrier: string
  score: number
  account_details: SeonPhoneAccountDetails
  history: SeonHistoryDetails
  flags: SeonFlag[]
  id: string
}

export interface SeonAppliedRule {
  id: SeonAppliedRuleId
  name: string
  operation: string
  score: number
}

export interface SeonResponseData {
  id: string
  state: RiskStatus
  fraud_score: number
  ip_details: SeonIpDetails
  email_details: SeonEmailDetails
  bin_details: SeonBinDetails
  phone_details: SeonPhoneDetails
  device_details: SeonDeviceDetails
  applied_rules: SeonAppliedRule[] | null
  version: string
  calculation_time: number
  seon_id: number
}

export interface SeonResponse {
  success: boolean
  error: {
    message?: string
    code?: ErrorCode
  }
  data: SeonResponseData
}

export interface SeonResponseJob extends SeonResponse {
  userId: string
  actionType: Action
}
