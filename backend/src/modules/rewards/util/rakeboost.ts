import { type RakeBoostType } from '../types'

const convertHoursToMilliseconds = (hours: number) => {
  return hours * 60 * 60 * 1000
}

export const RAKEBOOST_TYPE_INFO: Record<
  RakeBoostType,
  { duration: number; rakebackPercentage: number }
> = {
  affiliateCode: {
    duration: convertHoursToMilliseconds(72),
    rakebackPercentage: 20,
  },
  signUp: {
    duration: convertHoursToMilliseconds(24),
    rakebackPercentage: 10,
  },
  daily: {
    duration: convertHoursToMilliseconds(1),
    rakebackPercentage: 10,
  },
  weekly: {
    duration: convertHoursToMilliseconds(1),
    rakebackPercentage: 10,
  },
  monthly: {
    duration: convertHoursToMilliseconds(1),
    rakebackPercentage: 10,
  },
  rankUp: {
    duration: convertHoursToMilliseconds(1),
    rakebackPercentage: 10,
  },
  calendar: {
    duration: convertHoursToMilliseconds(1),
    rakebackPercentage: 15,
  },
}
