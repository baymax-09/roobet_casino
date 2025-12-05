import { type Category } from 'src/modules/bet/types'

type DeviceType = 'mobile' | 'desktop' | 'unknown'

export interface GameRound {
  user_id: string
  round_id: string
  game_id: string
  game_name: string
  game_type: Category
  vendor_id: string
  vendor_name?: string
  real_bet_user?: number
  real_win_user?: number
  bonus_bet_user?: number
  bonus_win_user?: number
  real_bet_base?: number
  real_win_base?: number
  bonus_bet_base?: number
  bonus_win_base?: number
  user_currency: string
  device_type: DeviceType
  timestamp: string
  origin: string
  meta?: object
}
