export const NotStartedState = 'NotStarted'
export const TakingBetsState = 'TakingBets'
export const RunningState = 'Running'
export const OverState = 'Over'

export const StateIds = {
  [NotStartedState]: 1,
  [TakingBetsState]: 2,
  [RunningState]: 3,
  [OverState]: 4,
} as const
