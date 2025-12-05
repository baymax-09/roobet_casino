import { type BalanceType } from 'common/types'

export interface Bet {
  autoCashout: number
  autobet: null
  balanceType: BalanceType
  betAmount: number
  betId: string
  cashoutCrashPoint: number
  closedOut: boolean
  closeoutComplete: boolean
  closeoutTimestamp: string
  deleteAfterRecord: boolean
  gameId: string
  gameIdentifier: string
  gameName: string
  gameNameDisplay?: string
  hidden: boolean
  highroller: boolean
  incognito: boolean
  manuallyClosedAt: number
  manuallyClosedOut: boolean
  mult: number
  payoutValue: number
  profit: number
  timestamp: string
  twoFactor: boolean
  type: string
  user?: {
    id: string
    mod: boolean
    name: string
  }
  userId: string
  won: boolean
  addedAt: string
  payoutMultiplier: number
}

export interface BetHistory extends Bet {
  roundHash?: string
  won: boolean
  _id: string
  createdAt: string
  updatedAt: string
}

export interface NormalizedBet extends BetHistory {
  light: boolean
  _betAmount: string
  _id: string
  _payout: string
  _profit: string
  _timestamp: string
  id: string // Bets from socket events
  game?: {
    squareImage?: string
  }
}

export interface ActiveBet extends Bet {
  id: string
  preparingCloseout?: boolean
}
