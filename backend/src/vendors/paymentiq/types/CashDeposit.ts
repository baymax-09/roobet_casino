import { type DepositStatus } from 'src/modules/deposit/types'
import {
  type PaymentMethod,
  type PaymentProvider,
  type ProviderResponse,
} from 'src/vendors/paymentiq/types'

export interface CashDepositTransaction {
  userId: string
  /** Payment Provider used for this transaction -- ie: Neteller, SafeCharge, etc */
  provider: PaymentProvider
  /** method that cash was transacted */
  paymentMethod: PaymentMethod
  amount: number
  currency: string
  externalId: string
  status: DepositStatus
  reason: string
  /** Original tx id for refund purposes */
  originTxId: string
  providerResponse?: ProviderResponse
}

export interface CashDeposit {
  id: string
  amount: number
  status: DepositStatus
  userId: string
  currency: string
  reason?: string
  externalId?: string
}
