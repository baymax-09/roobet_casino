// export type HotboxState = 'NotStarted' | 'TakingBets' | 'Running' | 'Over'
export const HotBoxStates = [
  'NotStarted',
  'TakingBets',
  'Running',
  'Over',
] as const
export type HotboxState = (typeof HotBoxStates)[number]

export const StateNotStarted: HotboxState = 'NotStarted'
export const StateTakingBets: HotboxState = 'TakingBets'
export const StateRunning: HotboxState = 'Running'
export const StateOver: HotboxState = 'Over'

export const states = {
  NotStarted: StateNotStarted,
  TakingBets: StateTakingBets,
  Running: StateRunning,
  Over: StateOver,
}
