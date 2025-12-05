export type CrashState = 'NotStarted' | 'TakingBets' | 'Running' | 'Over'

export const StateNotStarted: CrashState = 'NotStarted'
export const StateTakingBets: CrashState = 'TakingBets'
export const StateRunning: CrashState = 'Running'
export const StateOver: CrashState = 'Over'

export const CrashStates = {
  NotStarted: StateNotStarted,
  TakingBets: StateTakingBets,
  Running: StateRunning,
  Over: StateOver,
} as const
