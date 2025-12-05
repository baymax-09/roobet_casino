import {
  type DepositBonusReasons,
  type DepositBonusType,
  FIXED_TYPE,
  OTHER_REASON,
  PERCENT_TYPE,
} from 'common/types'

// Create a separate array for DepositBonusType values
export const DEPOSIT_BONUS_TYPES: DepositBonusType[] = [
  PERCENT_TYPE,
  FIXED_TYPE,
]

export const DEPOSIT_BONUS_REASONS: DepositBonusReasons[] = [
  'Bonus',
  OTHER_REASON,
]

export interface DepositBonusItem {
  id: string
  bonusType: DepositBonusType
  reason: DepositBonusReasons
  maxMatch?: number
  percentMatch?: number
  wagerRequirementMultiplier?: number
  minDeposit?: number
  expirationDate?: Date
  fixedAmount?: number
  specifiedReason?: string
}

// Errors
export type DepositBonusSubmitErrors = Partial<
  Record<keyof DepositBonusItem, string>
>
