import { type WithdrawStatusEnum } from 'src/modules/withdraw/types'
import {
  type PaymentMethod,
  type PaymentProvider,
  type ProviderResponse,
} from './PaymentProvider'

export interface CashWithdrawalTransaction {
  userId: string
  /** Payment Provider used for this transaction -- ie: Neteller, SafeCharge, etc */
  provider: PaymentProvider
  /** method that cash was transacted */
  paymentMethod: PaymentMethod
  amount: number
  currency: string
  externalId: string
  status: WithdrawStatusEnum
  reason: string
  /** Original tx id for refund purposes */
  originTxId: string
  providerResponse?: ProviderResponse
}

export interface CashWithdrawal {
  id: string
  amount: number
  status: WithdrawStatusEnum
  userId: string
  currency: string
  reason?: string
  externalId?: string
}
