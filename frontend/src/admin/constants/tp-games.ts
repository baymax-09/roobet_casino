export const TP_GAMES_SQUARE_IMAGE = {
  width: 500,
  height: 500,
  maxSize: 102400 * 3,
} as const

export const TP_GAME_APPROVAL_STATUS = [
  'pending',
  'approved',
  'declined',
] as const
export type TPGameApprovalStatus = (typeof TP_GAME_APPROVAL_STATUS)[number]
