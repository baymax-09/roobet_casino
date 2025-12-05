type BetType = 'Single' | 'Multi' | 'System'
type Status = 'Approved' | 'Rollback'
type TypeOfEvent = 'Bet' | 'Settlement'

interface BetOutcome {
  criterion_name: string
  outcome_label: string
  meta?: object
}

export interface Bet {
  event_name: string
  is_free_bet?: boolean
  is_risk_free_bet?: boolean
  market?: string
  match_start: string
  outcomes: BetOutcome[]
  sports_name?: string
  tournament_name?: string
  odds: number
  is_live?: boolean
  meta?: object
}

export interface SportsbookBetPayload {
  activity_id?: string
  activity_id_reference?: string
  amount: number
  balance_after?: number
  balance_before?: number
  bet_type: BetType
  odds: number
  bets: Bet[]
  bonus_wager_amount?: number
  currency: string
  exchange_rate: number
  is_cashout?: boolean
  locked_wager_amount?: number
  origin: string
  status: Status
  timestamp: string
  type: TypeOfEvent
  user_id: string
  wager_amount?: number
  device_type?: string
  meta?: object
}
