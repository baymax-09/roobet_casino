import { type User } from 'src/modules/user/types'

import { type RoowardTimespan } from './lib'

export * as Documents from './documents'
export * as Routes from './routes'
export * as Lib from './lib'

export { type RoowardTimespan, isValidRoowardsTimespan } from './lib'

interface Tier {
  percent: number
  wagerRequired: number
}

const dLevels: Tier[] = [
  {
    percent: 0,
    wagerRequired: 0,
  },
  {
    percent: 6.4,
    wagerRequired: 1000,
  },
  {
    percent: 6.7,
    wagerRequired: 2500,
  },
  {
    percent: 7,
    wagerRequired: 7500,
  },
  {
    percent: 7.3,
    wagerRequired: 15000,
  },
  {
    percent: 7.6,
    wagerRequired: 35000,
  },
  {
    percent: 7.9,
    wagerRequired: 60000,
  },
  {
    percent: 8.2,
    wagerRequired: 100000,
  },
  {
    percent: 8.5,
    wagerRequired: 140000,
  },
  {
    percent: 8.8,
    wagerRequired: 190000,
  },
  {
    percent: 9.1,
    wagerRequired: 250000,
  },
]

const wLevels: Tier[] = [
  {
    percent: 0,
    wagerRequired: 0,
  },
  {
    percent: 2.5,
    wagerRequired: 1500,
  },
  {
    percent: 2.6,
    wagerRequired: 5000,
  },
  {
    percent: 2.9,
    wagerRequired: 10000,
  },
  {
    percent: 3.2,
    wagerRequired: 20000,
  },
  {
    percent: 3.5,
    wagerRequired: 42000,
  },
  {
    percent: 3.8,
    wagerRequired: 85000,
  },
  {
    percent: 4.1,
    wagerRequired: 120000,
  },
  {
    percent: 4.4,
    wagerRequired: 160000,
  },
  {
    percent: 4.7,
    wagerRequired: 250000,
  },
  {
    percent: 5,
    wagerRequired: 300000,
  },
]

const mLevels: Tier[] = [
  {
    percent: 0,
    wagerRequired: 0,
  },
  {
    percent: 2,
    wagerRequired: 2000,
  },
  {
    percent: 2.1,
    wagerRequired: 6500,
  },
  {
    percent: 2.2,
    wagerRequired: 12500,
  },
  {
    percent: 2.3,
    wagerRequired: 25000,
  },
  {
    percent: 2.4,
    wagerRequired: 51000,
  },
  {
    percent: 2.5,
    wagerRequired: 95000,
  },
  {
    percent: 2.6,
    wagerRequired: 130000,
  },
  {
    percent: 2.8,
    wagerRequired: 180000,
  },
  {
    percent: 2.9,
    wagerRequired: 260000,
  },
  {
    percent: 3,
    wagerRequired: 400000,
  },
]

interface Rooward {
  days: number
  tiers: Array<{ level: number; wagerRequired: number }>
}
interface NextLevel {
  wagerRequired: number
  level: number
  percent?: number
}
interface LevelProgress {
  level: number
  percent?: number
  wagerRequired: number
  secondsRemaining?: number
  lastClaimed?: string
  nextLevel?: NextLevel
}
export type LevelsProgress = Record<RoowardTimespan, LevelProgress>

export const levelInfo: Record<RoowardTimespan, Rooward> = {
  // eslint-disable-next-line id-length
  d: {
    days: 1,
    tiers: dLevels.map((tier, level) => ({
      level,
      wagerRequired: tier.wagerRequired,
    })),
  },
  // eslint-disable-next-line id-length
  w: {
    days: 7,
    tiers: wLevels.map((tier, level) => ({
      level,
      wagerRequired: tier.wagerRequired,
    })),
  },
  // eslint-disable-next-line id-length
  m: {
    days: 30,
    tiers: mLevels.map((tier, level) => ({
      level,
      wagerRequired: tier.wagerRequired,
    })),
  },
}

export function getRequiredWagerForLevel({
  level,
  type,
}: {
  level: number
  type: RoowardTimespan
}): number {
  if (!Number.isInteger(level) || level < 0 || level > 10) {
    throw new Error(
      'Expect argument "level" to be a positive integer between 0 and 10.',
    )
  }

  const rewards = {
    /* eslint-disable id-length */
    d: dLevels,
    w: wLevels,
    m: mLevels,
    /* eslint-enable id-length */
  }

  const requiredWager = rewards?.[type]?.[level]?.wagerRequired
  if (!requiredWager) {
    throw new Error(`Invalid reward level ${type}:${level}`)
  }

  return Number(requiredWager)
}

/**
 * for the amount wagered, return the levels the user is at.
 */
export async function getLevels(
  user: User,
  trimForFrontend = false,
): Promise<LevelsProgress> {
  let playerWagered = user.hiddenTotalBet || 0
  if (user.roowardsBonus === true) {
    playerWagered += 1000
  }
  // for custom!
  if (!Number.isNaN(Number(user.roowardsBonus))) {
    playerWagered += user.roowardsBonus as number
  }

  const rewards: Readonly<Record<RoowardTimespan, Tier[]>> = {
    /* eslint-disable id-length */
    d: dLevels,
    w: wLevels,
    m: mLevels,
    /* eslint-enable id-length */
  }

  const payload: LevelsProgress = {
    // eslint-disable-next-line id-length
    d: {
      level: 0,
      ...dLevels[0],
    },
    // eslint-disable-next-line id-length
    w: {
      level: 0,
      ...wLevels[0],
    },
    // eslint-disable-next-line id-length
    m: {
      level: 0,
      ...mLevels[0],
    },
  }

  // TODO: Start after 2024-04-01 at 1PM Eastern Time, and remove after Q2 2024
  const promoStartDate = new Date('2024-04-01T13:00:00-04:00')
  const promoHasStarted = Date.now() >= promoStartDate.getTime()
  if (promoHasStarted) {
    for (const key of Object.keys(payload) as Array<keyof LevelsProgress>) {
      payload[key] = {
        ...rewards[key][10],
        level: 10,
      }
      if (trimForFrontend) {
        delete payload[key].percent
      }
    }

    return payload
  }

  for (const reward of Object.keys(payload)) {
    const name = reward as RoowardTimespan
    const levels = rewards[name]
    levels.forEach((level, idx) => {
      if (level.wagerRequired <= playerWagered) {
        payload[name] = {
          ...level,
          level: idx,
        }

        if (trimForFrontend) {
          delete payload[name].percent
        }

        if (levels[idx + 1]) {
          payload[name].nextLevel = {
            ...levels[idx + 1],
            level: idx + 1,
          }

          if (trimForFrontend) {
            delete payload[name].nextLevel?.percent
          }
        }
      }
    })
  }

  return payload
}
