import {
  type HandOutcomeType,
  type UserHandMainWagerRequest,
} from '../../types'
import { type BetAccessor, type PlayerBase } from './player'

/**
 * The type definition for Blackjack RTP test cases
 */
export interface BlackjackRtpTest {
  name: string
  inputs: {
    rounds: number
    playerFactory: (
      playerId: string,
      wagers: UserHandMainWagerRequest[],
      betProfit: BetAccessor,
    ) => PlayerBase
    wagersFactory: () => UserHandMainWagerRequest[]
  }
  expects: {
    rtp: number
    range: number
  }
}

/**
 * The type of hand/strategy table that guided the player's decision
 */
export type HandType = 'hard' | 'soft'

/**
 * The summary of how a round played out
 */
export interface RoundSummary {
  player: string
  dealer: string
  actions: string
}

export type BlackjackRTPHandStats = Partial<Record<number, RoundSummary[]>>

export type BlackjackRTPOutcomeStats = Partial<
  Record<HandOutcomeType, BlackjackRTPHandStats>
>

export type BlackjackRTPStatsOutcomes = Partial<
  Record<HandType, BlackjackRTPOutcomeStats>
>

/**
 * The type definition for Blackjack RTP stats
 */
export interface BlackjackRTPStats {
  total: number
  won: number
  wagered: number
  profit: number
  outcomes?: BlackjackRTPStatsOutcomes
}

/**
 * The type definition for Blackjack RTP game stats
 */
export interface BlackjackRTPGameStats {
  rtp: number
  hands: BlackjackRTPStats
  perfectPairs: BlackjackRTPStats
  twentyOnePlusThree: BlackjackRTPStats
  insurance: BlackjackRTPStats
}

/**
 * The default value for Blackjack RTP game stats. Very useful in a `reduce` function.
 */
export const BlackjackRTPGameStatsDefault: BlackjackRTPGameStats = {
  rtp: 0,
  hands: { total: 0, won: 0, wagered: 0, profit: 0 },
  perfectPairs: { total: 0, won: 0, wagered: 0, profit: 0 },
  twentyOnePlusThree: { total: 0, won: 0, wagered: 0, profit: 0 },
  insurance: { total: 0, won: 0, wagered: 0, profit: 0 },
}

/**
 * Reduces an array of {@link BlackjackRTPGameStats game stats} into a single {@link BlackjackRTPGameStats game stats}
 * @param rtpStats The array of {@link BlackjackRTPGameStats game stats}
 * @returns The single {@link BlackjackRTPGameStats game stats}
 */
export function reduceBlackjackRTPStats(
  rtpStats: BlackjackRTPGameStats[],
): BlackjackRTPGameStats {
  const outcomeStats = rtpStats.reduce((pre, cur) => {
    return {
      rtp: pre.rtp + cur.rtp,
      hands: {
        total: pre.hands.total + cur.hands.total,
        won: pre.hands.won + cur.hands.won,
        wagered: pre.hands.wagered + cur.hands.wagered,
        profit: pre.hands.profit + cur.hands.profit,
        outcomes: aggregate<BlackjackRTPStatsOutcomes>(
          pre.hands.outcomes,
          cur.hands.outcomes,
        ),
      },
      perfectPairs: {
        total: pre.perfectPairs.total + cur.perfectPairs.total,
        won: pre.perfectPairs.won + cur.perfectPairs.won,
        wagered: pre.perfectPairs.wagered + cur.perfectPairs.wagered,
        profit: pre.perfectPairs.profit + cur.perfectPairs.profit,
      },
      twentyOnePlusThree: {
        total: pre.twentyOnePlusThree.total + cur.twentyOnePlusThree.total,
        won: pre.twentyOnePlusThree.won + cur.twentyOnePlusThree.won,
        wagered:
          pre.twentyOnePlusThree.wagered + cur.twentyOnePlusThree.wagered,
        profit: pre.twentyOnePlusThree.profit + cur.twentyOnePlusThree.profit,
      },
      insurance: {
        total: pre.insurance.total + cur.insurance.total,
        won: pre.insurance.won + cur.insurance.won,
        wagered: pre.insurance.wagered + cur.insurance.wagered,
        profit: pre.insurance.profit + cur.insurance.profit,
      },
    }
  }, BlackjackRTPGameStatsDefault)
  return outcomeStats
}

export interface DataOperation<T = any> {
  field: string
  data: T
  op: 'add' | 'merge'
}
export interface DataOperationNumber extends DataOperation<number> {
  op: 'add'
}
export interface DataOperationObject extends DataOperation<object> {
  op: 'merge'
}
export const isDataOperation = (value: any): value is DataOperation =>
  typeof value === 'object' &&
  'field' in value &&
  value.field &&
  'data' in value &&
  value.data &&
  'op' in value &&
  value.op
export const isDataOperationNumber = (
  value: any,
): value is DataOperationNumber =>
  isDataOperation(value) && typeof value.data === 'number'
export const isDataOperationObject = (
  value: any,
): value is DataOperationObject =>
  isDataOperation(value) && typeof value.data === 'object'

export function merge<T extends object>(target: T, source: T): T {
  const merged: any = {}
  for (const key in target) {
    const targetValue = target[key]
    const sourceValue = source[key]
    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      merged[key] = targetValue.concat(sourceValue)
    } else if (
      typeof targetValue === 'object' &&
      targetValue !== null &&
      typeof sourceValue === 'object' &&
      sourceValue !== null
    ) {
      merged[key] = merge(targetValue, sourceValue)
    } else {
      merged[key] = sourceValue ?? targetValue
    }
  }
  for (const key in source) {
    if (!(key in target)) {
      merged[key] = source[key]
    }
  }
  return merged
}

export function aggregate<T extends object>(target?: T, source?: T): T {
  if (!target || !source) {
    return target ?? source ?? ({} as unknown as T)
  }

  const merged: any = {}
  for (const key in target) {
    const targetValue = target[key]
    const sourceValue = source[key]
    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      merged[key] = targetValue.concat(sourceValue)
    } else if (
      typeof sourceValue === 'number' &&
      typeof targetValue === 'number'
    ) {
      merged[key] = targetValue + sourceValue
    } else if (
      typeof targetValue === 'object' &&
      targetValue !== null &&
      typeof sourceValue === 'object' &&
      sourceValue !== null
    ) {
      merged[key] = aggregate(targetValue, sourceValue)
    } else {
      merged[key] = sourceValue ?? targetValue
    }
  }
  for (const key in source) {
    if (!(key in target)) {
      merged[key] = source[key]
    }
  }
  return merged
}
