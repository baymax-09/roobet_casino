export type FreeBetType = 'cash' | 'crypto' | 'eth' | 'ltc'

interface FreeBetBuffSettings {
  games: string[]
  freeBetAmount: number
  freeBetType: FreeBetType
}

interface RoowardsBuffSettings {
  roowardsModifier: number
}

export interface FreeSpinGame {
  identifier: string
  pragmaticGameId?: string | null
}

export interface FreeSpinType {
  tpGameAggregator: string
  games: FreeSpinGame[]
  numberOfSpins: number
  spinAmount: number
}

interface FreeSpinsBuffSettings {
  freeSpins: FreeSpinType[]
}

export type BuffSettings =
  | FreeBetBuffSettings
  | RoowardsBuffSettings
  | FreeSpinsBuffSettings

/*
 * ERROR TYPES
 */
export interface FreeSpinTypeError {
  tpGameAggregator?: string
  numberOfSpins?: string
  spinAmount?: string
}
