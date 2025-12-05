export type BalanceKey = 'real_money' | 'bonus_money'

export interface BalanceUpdate {
  amount: number
  currency: string
  key: BalanceKey
  exchange_rate: number
}
