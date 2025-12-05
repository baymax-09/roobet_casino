export type WithdrawalStatus =
  | 'waiting'
  | 'processing'
  | 'sending'
  | 'finished'
  | 'failed'
  | 'rejected'
  | 'flagged'

export interface WithdrawalResponse {
  address: string
  amount: string
  batchWithdrawalId: string
  createdAt: string | null
  currency: string
  error: string | null
  extra_id: string | null
  hash: string | null
  id: string
  requestedAt: string | null
  status: WithdrawalStatus
  updatedAt: string | null
}
