export const StateNotStarted = 'NotStarted'
export const StateTakingBets = 'TakingBets'
export const StatePayout = 'Payout'
export const StateOver = 'Over'

export const RouletteStates = {
  NotStarted: StateNotStarted,
  TakingBets: StateTakingBets,
  Payout: StatePayout,
  Over: StateOver,
} as const
