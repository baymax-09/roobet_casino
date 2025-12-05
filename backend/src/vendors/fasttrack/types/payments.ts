import { type DepositStatus } from 'src/modules/deposit/types'
import { type WithdrawStatus } from 'src/modules/withdraw/types'

export type PaymentStatus =
  | 'Approved'
  | 'Rollback'
  | 'Requested'
  | 'Rejected'
  | 'Cancelled'
export type PaymentType = 'Debit' | 'Credit'

export interface PaymentPayload {
  amount: number
  bonus_code?: string
  currency: string
  exchange_rate: number
  fee_amount?: number
  note?: string
  origin: string
  payment_id: string
  status: PaymentStatus
  timestamp: string
  type: PaymentType
  user_id: string
  vendor_id: string
  vendor_name?: string
  deposit_count?: number
}

interface PaymentInfo {
  currency: string
  amount: number
  paymentId: string
  userId: string
  vendorId: string
}

export interface WithdrawalInfo extends PaymentInfo {
  status: WithdrawStatus
}

export interface DepositInfo extends PaymentInfo {
  status: DepositStatus
}
