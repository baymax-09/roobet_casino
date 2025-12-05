import { type RankLevel } from '../types/ranks'

interface RankUpInfoValue {
  rakebackPercentage: number
  cashPercentage: number
  calendarPercentage: number
  wagerRequirement: number
}

export const RANK_UP_INFO: Record<RankLevel, RankUpInfoValue> = {
  0: {
    rakebackPercentage: 4,
    cashPercentage: 20,
    calendarPercentage: 80,
    wagerRequirement: 0,
  },
  1: {
    rakebackPercentage: 4.1,
    cashPercentage: 21,
    calendarPercentage: 79,
    wagerRequirement: 1000,
  },
  2: {
    rakebackPercentage: 4.2,
    cashPercentage: 22,
    calendarPercentage: 78,
    wagerRequirement: 2700,
  },
  3: {
    rakebackPercentage: 4.4,
    cashPercentage: 23,
    calendarPercentage: 77,
    wagerRequirement: 5500,
  },
  4: {
    rakebackPercentage: 4.6,
    cashPercentage: 24,
    calendarPercentage: 76,
    wagerRequirement: 10_000,
  },
  5: {
    rakebackPercentage: 4.8,
    cashPercentage: 25,
    calendarPercentage: 75,
    wagerRequirement: 18_500,
  },
  6: {
    rakebackPercentage: 5,
    cashPercentage: 26,
    calendarPercentage: 74,
    wagerRequirement: 32_000,
  },
  7: {
    rakebackPercentage: 5.2,
    cashPercentage: 27,
    calendarPercentage: 73,
    wagerRequirement: 56_000,
  },
  8: {
    rakebackPercentage: 5.4,
    cashPercentage: 28,
    calendarPercentage: 72,
    wagerRequirement: 95_000,
  },
  9: {
    rakebackPercentage: 5.6,
    cashPercentage: 29,
    calendarPercentage: 71,
    wagerRequirement: 160_000,
  },
  10: {
    rakebackPercentage: 5.8,
    cashPercentage: 30,
    calendarPercentage: 70,
    wagerRequirement: 275_000,
  },
  11: {
    rakebackPercentage: 6,
    cashPercentage: 31,
    calendarPercentage: 69,
    wagerRequirement: 460_000,
  },
  12: {
    rakebackPercentage: 6.2,
    cashPercentage: 32,
    calendarPercentage: 68,
    wagerRequirement: 785_000,
  },
  13: {
    rakebackPercentage: 6.4,
    cashPercentage: 33,
    calendarPercentage: 67,
    wagerRequirement: 1_300_000,
  },
  14: {
    rakebackPercentage: 6.6,
    cashPercentage: 34,
    calendarPercentage: 66,
    wagerRequirement: 2_250_000,
  },
  15: {
    rakebackPercentage: 6.8,
    cashPercentage: 35,
    calendarPercentage: 65,
    wagerRequirement: 3_800_000,
  },
  16: {
    rakebackPercentage: 7,
    cashPercentage: 36,
    calendarPercentage: 64,
    wagerRequirement: 6_500_000,
  },
  17: {
    rakebackPercentage: 7.2,
    cashPercentage: 37,
    calendarPercentage: 63,
    wagerRequirement: 10_000_000,
  },
  18: {
    rakebackPercentage: 7.4,
    cashPercentage: 38,
    calendarPercentage: 62,
    wagerRequirement: 18_000_000,
  },
  19: {
    rakebackPercentage: 7.6,
    cashPercentage: 39,
    calendarPercentage: 61,
    wagerRequirement: 30_000_000,
  },
  20: {
    rakebackPercentage: 7.8,
    cashPercentage: 40,
    calendarPercentage: 60,
    wagerRequirement: 50_000_000,
  },
  21: {
    rakebackPercentage: 8,
    cashPercentage: 41,
    calendarPercentage: 59,
    wagerRequirement: 88_000_000,
  },
  22: {
    rakebackPercentage: 8.2,
    cashPercentage: 42,
    calendarPercentage: 58,
    wagerRequirement: 150_000_000,
  },
  23: {
    rakebackPercentage: 8.4,
    cashPercentage: 43,
    calendarPercentage: 57,
    wagerRequirement: 250_000_000,
  },
  24: {
    rakebackPercentage: 8.6,
    cashPercentage: 44,
    calendarPercentage: 56,
    wagerRequirement: 425_000_000,
  },
  25: {
    rakebackPercentage: 8.8,
    cashPercentage: 45,
    calendarPercentage: 55,
    wagerRequirement: 720_000_000,
  },
  26: {
    rakebackPercentage: 9,
    cashPercentage: 46,
    calendarPercentage: 54,
    wagerRequirement: 1_200_000_000,
  },
  27: {
    rakebackPercentage: 9.25,
    cashPercentage: 47,
    calendarPercentage: 53,
    wagerRequirement: 2_000_000_000,
  },
  28: {
    rakebackPercentage: 9.5,
    cashPercentage: 48,
    calendarPercentage: 52,
    wagerRequirement: 3_500_000_000,
  },
  29: {
    rakebackPercentage: 9.75,
    cashPercentage: 49,
    calendarPercentage: 51,
    wagerRequirement: 6_000_000_000,
  },
  30: {
    rakebackPercentage: 10,
    cashPercentage: 50,
    calendarPercentage: 50,
    wagerRequirement: 10_000_000_000,
  },
} as const
