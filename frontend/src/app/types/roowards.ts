import { type useTranslate } from 'app/hooks'

export const RoowardTimespans = ['d', 'w', 'm'] as const

export type RoowardTimespan = (typeof RoowardTimespans)[number]

export type Level = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface Rooward {
  days: number
  tiers: Array<{ level: Level; wagerRequired: number }>
}

export interface LevelProgress {
  level: Level
  percent?: number
  wagerRequired: number
  secondsRemaining?: number
  lastClaimed?: Date
  nextLevel?: { wagerRequired: number; level: Level; percent?: number }
}

export type LevelsProgress = Record<RoowardTimespan, LevelProgress>

export type LevelInfo = Record<RoowardTimespan, Rooward>

export type Mode = 'levelUp' | 'claim' | 'claimed'

export const getRoowardsTitle = (
  type: RoowardTimespan,
  translate: ReturnType<typeof useTranslate>,
): string | undefined => {
  if (type === 'd') {
    return translate('reward.daily')
  }

  if (type === 'w') {
    return translate('reward.weekly')
  }

  if (type === 'm') {
    return translate('reward.monthly')
  }
}
