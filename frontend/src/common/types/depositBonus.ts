export const OTHER_REASON = 'Other (Please Specify Below)'
export const FIXED_TYPE = 'Fixed'
export const PERCENT_TYPE = 'Percent Match'

export type DepositBonusType = typeof PERCENT_TYPE | typeof FIXED_TYPE
export type DepositBonusReasons = 'Bonus' | `Other ${string}`
