import { type VerificationError } from '../types'

export const VerificationErrorMap: Record<string, VerificationError> = {
  GAME_STILL_ACTIVE: {
    code: 101,
    message: 'game__still_active',
  },
  NO_ROUND: {
    code: 102,
    message: 'no__round',
  },
  NO_ROUND_BET: {
    code: 103,
    message: 'no__round',
  },
  GAME_TOO_OLD: {
    code: 104,
    message: 'game__too_old_to_verify',
  },
}
