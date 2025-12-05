import { determineSingleFeatureAccess } from 'src/util/features'
import { type ActiveBet } from 'src/modules/bet/types'

import { type RouletteGame } from '../types'

// 1 = bronze, 2 = silver, 3 = gold, 4 = bait
export const WinningNumberValues = [1, 2, 3, 4] as const
export type WinningNumber = (typeof WinningNumberValues)[number]

const OutcomeValueValues = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
] as const
export type OutcomeValue = (typeof OutcomeValueValues)[number]

interface BetInfo {
  count: number
  multiplier: number
  name: string
}

export const isWinningNumber = (value: any): value is WinningNumber =>
  WinningNumberValues.includes(value)
export const isOutcomeValue = (value: any): value is OutcomeValue =>
  OutcomeValueValues.includes(value)

// @ts-expect-error error will be fixed once roulette rework fully integrated
export const betInfo: Record<WinningNumber, BetInfo> = {
  1: {
    count: 7,
    multiplier: 2,
    name: 'red',
  },
  2: {
    count: 7,
    multiplier: 2,
    name: 'black',
  },
  3: {
    count: 1,
    multiplier: 14,
    name: 'gold',
  },
}
// TODO: Remove and add 4 to betInfo once roulette rework has been released
export const getBetInfo = async () => {
  if (
    await determineSingleFeatureAccess({
      countryCode: '',
      featureName: 'housegames:roulette',
    })
  ) {
    return {
      ...betInfo,
      4: {
        count: 2,
        multiplier: 7,
        name: 'bait',
      },
    }
  }
  return betInfo
}

export const outcomeValueToWinningNumbers: Record<
  OutcomeValue,
  WinningNumber[]
> = {
  0: [3],
  1: [1],
  2: [1],
  3: [1],
  4: [1],
  5: [1],
  6: [1],
  7: [1, 4],
  8: [2, 4],
  9: [2],
  10: [2],
  11: [2],
  12: [2],
  13: [2],
  14: [2],
}

export const getPayoutValue = async (bet: ActiveBet, game: RouletteGame) => {
  if (!bet.betSelection) {
    return 0
  }
  const betInfo = await getBetInfo()
  if (
    outcomeValueToWinningNumbers[game.spinNumber].includes(bet.betSelection)
  ) {
    return bet.betAmount * betInfo[bet.betSelection].multiplier
  }
  return 0
}

export const betStateTime = 14000
export const payoutStateTime = 7000
export const overStateTime = 3000
