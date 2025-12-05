import { type DeepNullable, type DeepPartial } from 'ts-essentials'

type DeepPartialNullable<T> = DeepPartial<DeepNullable<T>>

export type SportsbookBonusTemplate = DeepPartialNullable<{
  id: number
  title: string
  active: boolean
  // 1 - Freebet; 2 - Comboboost
  bonus_type: 1 | 2
  active_from: number
  active_to: number
  custom_options: {
    restrictions: null
    freebet_data: {
      amount_list: Array<{
        amount: number
        max_cap: number
        currency: string
      }> | null
      type: 'bet_refund' | 'free_money' | 'snr'
      min_selection: number
      max_selection: number
      min_odd: number
      max_odd: number
    }
    comboboost_data: {
      min_odd: 0
      multipliers: string[]
      total_multiplier: number
      is_global: boolean
    }
  }
}>

export interface SportsbookBonus {
  _id: string
  userId: string
  slotegratorId: number
  externalId: string
  templateId: number
  type: 'comboboost' | 'freebet'
  activeFrom: string
  activeTo: string
  activated: boolean
  amount: number
  createdAt: string
  updatedAt: string
  status: string
}
