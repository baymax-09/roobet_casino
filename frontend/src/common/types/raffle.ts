/**
 * This list should be updated as additional
 * types are added to the backend.
 */
export const RaffleTypes = ['default', 'advent'] as const

export interface Winner {
  user: {
    id: string
    name: string
  }
  tickets: {
    tickets: number
  }
}

export interface Raffle {
  _id: string
  id: string
  amount: number
  archived: boolean
  config: {
    dailyGame?: {
      identifier: string
      url: string
    }
  }
  bannerImage: RoobetAssetPath<AssetType>
  createdAt?: Date
  end: Date
  featureImage: RoobetAssetPath<AssetType>
  heroImage: RoobetAssetPath<AssetType>
  isActive: boolean
  modifiers: RaffleModifier[]
  name: string
  payouts: string[]
  slug: string
  start: Date
  ticketsPerDollar: number
  baseDollarAmount: number
  type: (typeof RaffleTypes)[number]
  updatedAt?: Date
  winnerCount: number
  winners: Winner[] | null
  winnersRevealed: boolean
}

export const RaffleModifierTypes = [
  'gameIdentifier',
  'gameProvider',
  'gameGroup',
] as const
export type RaffleModifierType = (typeof RaffleModifierTypes)[number]

export interface RaffleModifierIdentifier {
  id: string
  title: string
}

export interface RaffleModifier {
  identifiers: RaffleModifierIdentifier[]
  ticketsPerDollar: number
  type: RaffleModifierType
}
