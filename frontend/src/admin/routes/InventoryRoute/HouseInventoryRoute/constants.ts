import {
  type RarityType,
  type BuffType,
  type FrequencyType,
  type FreeBetType,
} from './../types'

export const RARITY_TYPES: RarityType[] = [
  'COMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
]

export const BUFF_TYPES: BuffType[] = [
  // 'FREE_BET',
  // 'ROOWARDS',
  'FREE_SPINS',
  // 'EMOTE',
]

export const FREQUENCY_TYPES: FrequencyType[] = [
  'HOURS',
  'DAYS',
  'WEEKS',
  'MONTHS',
]

export const FREE_BET_TYPES: FreeBetType[] = ['cash', 'crypto', 'eth', 'ltc']

export const GAME_PROVIDERS = [
  'softswiss',
  'pragmatic',
  'hacksaw',
  'slotegrator',
]

export const PRAGMATIC_SPIN_AMOUNT_VALUES = [
  0, 0.2, 0.4, 0.6, 0.8, 1, 2, 4, 6, 8, 10, 15, 20, 40, 60, 80, 100,
]

export const SLOTEGRATOR_FREESPIN_DENOMINATIONS = [
  '0.01',
  '0.1',
  '0.5',
  '1.0',
  '5.0',
  '10.0',
]
