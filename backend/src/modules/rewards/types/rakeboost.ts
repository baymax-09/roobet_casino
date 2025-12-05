export const RakeBoostTypes = [
  'signUp',
  'daily',
  'weekly',
  'monthly',
  'calendar',
  'affiliateCode',
  'rankUp',
] as const
export type RakeBoostType = (typeof RakeBoostTypes)[number]

/**
 * This is the description of the interface
 *
 * @interface RakeBoost
 * @member rakebackPercentage The rakeback percentage applied to instant rewards during the rake boost period.
 * Must be a number between 0 and 100.
 * @member totalEarned The total amount earned during this rake boost period.
 * @member type The type of rakeboost, i.e. how it started. E.g., started from user sign-up, claiming daily reward, etc.

 */
export interface RakeBoost {
  userId: string
  startTime: Date
  endTime: Date
  rakebackPercentage: number
  totalEarned: number
  type: RakeBoostType
}
