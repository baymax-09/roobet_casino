export interface Notification {
  id: string
  userId: string | number // Only "number" when received from FastTrack
  message: string
  read: boolean
  type: NotificationType
  meta: Record<string, any>
  createdAt?: string
  updatedAt?: string
  __typename: 'Notification'
}

export type NotificationType =
  | 'misc'
  | 'withdraw'
  | 'refund'
  | 'hold'
  | 'survey'
  | 'payout'
  | 'chargeback'
  | 'koth'
  | 'rain'
  | 'tip'
  | 'deposit'
  | 'kyc'
  | 'cashback'
  | 'wager'
  | 'sportsbook'
  | 'freeSpin'
  | 'richInbox'
