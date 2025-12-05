import { type TronAddressBase58 } from './wallet'

export interface ApprovalTransactionInfo {
  walletToApprove: TronAddressBase58
  /** hex string */
  amountToApprove: string
}

export interface TRC20PoolingTransactionInfo {
  from: TronAddressBase58
  to: TronAddressBase58
  amount: number
}
