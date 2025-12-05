import { type Types as GameTypes } from 'src/modules/game'
import { type DisplayUser, type BalanceType } from 'src/modules/user/types'
import { type Currency } from 'src/modules/currency/types'
import { type WinningNumber } from 'src/modules/roulette/constant/roulette'

// TODO: This should be removed because category can be any arbitrary string.
const CategoryOptions = [
  'craps',
  'slots',
  'live-games',
  'lottery',
  'roulette',
  'roulette - special',
  'blackjack',
  'card',
  'casual',
  'poker',
  'sportsbetting',
  'house',
  'Unknown',
  'bingo',
  'table',
] as const

export type Category = (typeof CategoryOptions)[number]

/**
 * Check if a category is valid
 * @param category The category to check
 * @returns `true` if the category is valid, `false` otherwise
 */
export function isValidCategory(category: any): category is Category {
  return CategoryOptions.includes(category)
}

export const ThirdParties = [
  'hacksaw',
  'playngo',
  'pragmatic',
  'hub88',
  'slotegrator',
  'softswiss',
  'redtiger',
] as const
export type ThirdParty = (typeof ThirdParties)[number]
export const isThirdParty = (value: any): value is ThirdParty =>
  ThirdParties.includes(value)

export interface BetUser {
  id: string
  name: string
  rank: string
}

// TODO: This type should not exist. We never have a "bet". We only have an active
// bet record (regardless of source) or a history of a bet. Additionally, an active bet
// should NOT be a subset of a bet history.
interface Bet {
  attempts?: number
  betAmount: number
  currency?: Currency
  gameName: GameTypes.HouseGameName
  gameId: string
  closedOut: boolean
  highroller: boolean
  incognito: boolean
  balanceType: BalanceType
  timestamp: Date
  userId: string
  manuallyClosedOut?: boolean
  manuallyClosedAt?: number
  betId?: string
  gameNameDisplay?: string
  transactionIds?: string[]
  thirdParty?: ThirdParty
  won?: boolean
  category?: Category
  gameIdentifier?: string
  nonce?: number
  paidOut?: boolean
  closeoutComplete?: boolean
  ranHooks?: boolean
  payoutValue?: number // maybe this belongs on ActiveBet instead?
  payoutMultiplier?: number
  gameSessionId?: string
  round?: string
  profit?: number

  /* random stuff */
  clientSeed?: string
  cashoutCrashPoint?: number
  autoCashout?: number
  betSelection?: WinningNumber
  winningNumber?: WinningNumber
  crashPoint?: number
  hash?: string
  twoFactor?: boolean
  user?: BetUser | DisplayUser | null
  recordedBetHistoryMongo?: boolean
  deleteAfterRecord?: boolean
  errors?: Record<string, string | boolean>
  mult?: number
}

export interface ActiveBet extends Bet {
  id: string
  preparingCloseout?: boolean
}

export interface BetHistory extends Omit<ActiveBet, 'id' | 'betId'> {
  betId: string
  errors?: Record<string, string | boolean>
  closeoutTimestamp?: Date | null
  deleteAfterRecord?: boolean
  mult?: number
  payoutValue?: number
  profit?: number
  won?: boolean
  roundId?: string
  addedAt?: string
  timestamp: Date
}
