interface ParamConfig {
  version: string
  /** csv -- ie: flags,history,id */
  include?: string
  timeout?: number
  flags_timeframe_days?: number
}

export type Label = 'Successful transaction' | 'Failed transaction'

export type Action =
  | 'cash_deposit'
  | 'cash_withdraw'
  | 'crypto_deposit'
  | 'crypto_withdraw'
  | 'user_signup'
  | 'tip'
  | 'kyc_level1_save'

export interface SeonRequestConfig {
  ip: ParamConfig
  email: ParamConfig
  phone: ParamConfig

  email_api: boolean
  phone_api: boolean
  ip_api: boolean
  device_fingerprinting: boolean
}

export interface KYCSeonRecord {
  /** specifically, a date string with format YYYY-MM-DD */
  user_dob?: string
  user_country?: string
  user_zip?: string
  user_region?: string
  user_street?: string
  user_street2?: string
  phone_number?: string
  user_firstname?: string
  user_lastname?: string
  user_fullname?: string
  user_city?: string
}

export interface SeonRequest<T extends object = object> extends KYCSeonRecord {
  config: SeonRequestConfig
  action_type: Action

  ip?: string

  /** User Account Info */
  affiliate_id?: string
  affiliate_name?: string
  order_memo?: string
  email?: string
  email_domain?: string
  password_hash?: string
  user_name?: string
  user_id?: string
  user_created?: number
  user_category?: string
  user_account_status?: string
  user_balance?: number
  user_verification_level?: string

  /** User Session */
  session_id?: string
  session?: string
  device_id?: string

  /** User Generic Payments */
  payment_mode?: string
  payment_provider?: string
  transaction_id?: string
  transaction_type?: string
  transaction_amount?: number
  transaction_currency?: string
  phone_number?: string

  /** User Bank Account */
  user_bank_account?: string
  user_bank_name?: string

  /** User Credit Card */
  card_fullname?: string
  card_bin?: string
  card_hash?: string
  card_expire?: Date
  card_last?: string
  avs_result?: string
  cvv_result?: boolean
  billing_country?: string
  billing_city?: string
  billing_region?: string
  billing_zip?: string
  billing_street?: string
  billing_street2?: string
  billing_phone?: string
  /** Status of 3D Secure Results */
  status_3d?: string
  /** Strong Customer Authentication */
  sca_method?: string

  custom_fields?: T
}
