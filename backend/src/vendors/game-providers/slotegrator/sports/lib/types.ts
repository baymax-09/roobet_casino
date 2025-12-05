interface BetParameters {
  category_id?: string
  category_name?: string
  competitor_name?: string[]
  is_live?: boolean
  market_name?: string
  odds?: string
  outcome_name?: string
  scheduled?: number
  sport_id?: string
  sport_name?: string
  tournament_id?: string
  tournament_name?: string
}

export interface BetItem {
  event_id: string
  parameters: BetParameters
  uuid: string
}

interface BetSlipParameters {
  bonus_id?: string
  bonus_type?: string
  is_quick_bet?: boolean
  potential_comboboost_win?: number
  potential_win?: number
  timestamp?: string
  total_odds?: string
  type?: string
}

export interface BetSlip {
  amount: number
  currency: string
  items: BetItem[]
  parameters: BetSlipParameters
  provider_betslip_id: string
  status: 'open' | 'settled'
  uuid: string
}
