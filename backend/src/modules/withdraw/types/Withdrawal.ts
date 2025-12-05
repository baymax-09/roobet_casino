import { type ObjectId } from 'mongoose'

import { type CountryCodeEnum } from 'src/util/types'
import {
  type PortfolioBalanceType,
  type BalanceType,
} from 'src/modules/user/types'
import { type Currency } from 'src/modules/currency/types'
import { type CryptoNetwork } from 'src/modules/crypto/types'

import { type WithdrawalPluginType } from './Plugin'

/**
 * @todo remove this enum in favor of type WithdrawStatus
 */
export enum WithdrawStatusEnum {
  INITIATED = 'initiated',
  PENDING = 'pending',
  PROCESSING = 'processing',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  COMPLETED = 'completed',
  DECLINED = 'declined',
  /** This is the status that we use to backoff of a failing withdrawal */
  REPROCESSING = 'reprocessing',
  FLAGGED = 'flagged',
}

export const WithdrawStatuses = [
  'initiated',
  'pending',
  'processing',
  'cancelled',
  'failed',
  'declined',
  'completed',
  'reprocessing',
  'flagged',
] as const
export type WithdrawStatus = (typeof WithdrawStatuses)[number]
export const isValidWithdrawStatus = (value: any): value is WithdrawStatus =>
  WithdrawStatuses.includes(value)

export interface CryptoWithdrawal {
  _id: ObjectId
  id: string
  attempts: number
  totalValue: number
  userId: string
  status: WithdrawStatus
  request: WithdrawalRequest
  timestamp: string
  transactionId: string

  /** These 3 fields are necessary because currency currently only denotes USD
   * Ideally, "plugin" is deprecated in place of currency representing the crypto token
   * and the "network" representing the crypto network where the token is held
   */
  network: CryptoNetwork
  plugin: WithdrawalPluginType
  currency: Currency

  reason?: string
  meta?: WithdrawalResponse
  cashout?: boolean
}
export interface WithdrawalRequestFields {
  address?: string
  tag?: string
  countryCode?: CountryCodeEnum
  phone?: string
  priority?: string
  currency?: PortfolioBalanceType
  userFeePaid?: number
}

export interface WithdrawalRequest {
  plugin: WithdrawalPluginType
  network: CryptoNetwork
  /**
   * @todo There is business logic for both of these fields that will throw based on values being present or not.
   * We should only be using amount or totalValue
   */
  totalValue: number
  amount: number
  fields: WithdrawalRequestFields
  userIp?: string
  sourceBalanceType?: BalanceType
}
export interface CashWithdrawalRequest
  extends Omit<WithdrawalRequest, 'plugin' | 'network'> {
  plugin: 'paymentIq'
}

export interface WithdrawalResponse {
  fields?: WithdrawalRequestFields
  hash?: string
  data?: any
  transactionId?: string
}
