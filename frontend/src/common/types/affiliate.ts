import { type User } from './user'

interface Tier {
  tier: number
  cut: number
  countRequired: number
  wagerRequired: number
}
interface Transaction extends Record<string, any> {
  sum: number
  user: User
}

export interface Campaign {
  depositCount: number
  earnedTotal: number
  earningsPerDay: Transaction[]
  earningsPerUser: Transaction[]
  newDepositorCount: number
  referralCount: number
  referralsDeposited: number
  referralsWagered: number
  referredBy: string | boolean // wtf...
  tier: {
    current: Tier
    next: Tier
  }
}
