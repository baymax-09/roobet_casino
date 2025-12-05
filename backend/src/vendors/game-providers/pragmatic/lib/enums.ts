import { type ValueOf } from 'ts-essentials'

export const SeamlessWalletStatusCodes = {
  SUCCESS: 0,
  INSUFFICIENT_BALANCE: 1,
  PLAYER_NOT_FOUND: 2,
  BET_NOT_ALLOWED: 3,
  INVALID_TOKEN: 4,
  INVALID_HASH: 5,
  PLAYER_FROZEN: 6,
  BAD_PARAMS: 7,
  GAME_NOT_FOUND: 8,
  BET_LIMIT_REACHED: 50,
  INTERNAL_SERVER_ERROR_PLEASE_RECONCILE: 100,
  INTERNAL_SERVER_ERROR_NO_RECONCILE: 120,
  INTERNAL_SERVER_ERROR_ENDROUND: 130,
  REALITY_CHECK_WARNING: 210,
  BET_OUTSIDE_BET_LIMITS: 310,
} as const

export type StatusCode = ValueOf<typeof SeamlessWalletStatusCodes>
export type ErrorCode = Exclude<StatusCode, 0>
