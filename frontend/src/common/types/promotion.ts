import { type BalanceType } from './balanceTypes'

interface BasePromotion {
  id: string
  creatorUserId: string
  claimAmount: number
  roowardsBonus: boolean
  claimsRemaining: number
  originalClaims: number
  expiration: string
  code: string
  depositCount?: { amount: number; hours: number }
  depositLimit?: { amount: number; hours: number }
  wagerLimit?: { amount: number; hours: number }
  hasNotDeposited: boolean
  affiliateName: string | false
  cxAffId: string // Cellxpert Affiliate ID
  mustBeAffiliated: boolean
  claimedUserIds: Record<string, boolean>
  claimedUserIPs: Record<string, boolean>
  timestamp: string
  // LEGACY
  newUsersOnly?: boolean
  activeOnly?: boolean
}

export type Promotion =
  | (BasePromotion & {
      roowardsBonus: true
      balanceType: null
    })
  | (BasePromotion & {
      roowardsBonus: false
      balanceType: BalanceType
    })

export interface RedeemResponse {
  referral?: boolean
  roowardsBonus?: boolean
  redeemed?: boolean
  amount?: number
  amountType?: string
}
