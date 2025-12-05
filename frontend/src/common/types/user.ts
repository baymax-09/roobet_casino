import { type TPGame, type BalanceType } from 'common/types'
import { type DisplayCurrency } from 'common/constants'
import { type MatchPromoProps } from 'app/components/MatchPromo/MatchPromo'

import { type RippleDepositInfo } from './crypto'
import { type KYCGet, type VerifiedKYCLevel, type KYCLevel } from './kyc'

interface UserBalance {
  crypto: number
  eth: number
  ltc: number
  cash: number
  selectedBalanceType: BalanceType
}

export interface Lookup {
  key: string
  index: string
}

export interface LookupRecord extends Lookup {
  id: string
}

/**
 * @note we call this a User but it is really the amalgamation from /account/get.
 * @todo separate User from /account/get blob.
 */
export interface User {
  id: string
  // Since we sometimes set countryCode with external services, we can't be sure that our CountryCodeEnum is definitive
  countryCode: string
  createdAt: string
  email: string
  lastLogin: string
  name: string
  nameLowercase: string

  // Roles.
  mod?: boolean
  staff?: boolean
  isChatMod?: boolean
  hasChatDevBadge?: boolean
  hasChatModBadge?: boolean
  isInfluencer?: boolean
  isWhale?: boolean
  emailVerified?: boolean
  balance?: number
  ethBalance?: number
  ltcBalance?: number
  cashBalance?: number
  chatLabel?: string
  level?: number
  locale?: string
  totalDeposited?: number
  authNonce?: number
  role?: string
  totalWon?: number
  totalWithdrawn?: number
  totalEarnings?: number
  invalidLoginAttempts?: number
  lastDeposit?: string // rethink timestamp
  lastBet?: string // date?
  mustSetName?: boolean
  department?: string
  profileIsPrivate?: boolean
  isMarketing?: boolean
  manager?: string
  userKYCOverrideLevel?: VerifiedKYCLevel
  kycRequiredLevel?: KYCLevel
  lastFingerprint?: Date

  // Bet Goals
  betGoal?: number // Bitcoin
  ethBetGoal?: number
  ltcBetGoal?: number
  cashBetGoal?: number
  altcoinBetGoal?: number

  totalTipped: number
  totalTipsReceived: number
  hiddenTotalWithdrawn: number
  hiddenTotalDeposited: number
  hiddenTotalDeposits: number
  hiddenTotalBet: number
  hiddenTotalWon: number
  hiddenTotalBets: number
  // TODO hydrate sports metrics when fetching DBUser
  hiddenSportsTotalBets?: number
  hiddenSportsTotalBet?: number
  hiddenSportsTotalWon?: number
  offerDeposits: number
  offerDeposited: number
  promosClaimed: number
  lastPromoClaimed?: Date // Date?

  /** user referrals */
  referralEarnings?: number
  refCount?: number
  affiliateId?: string
  affiliateUnpaid?: number
  customAffiliateCut?: number | false
  affiliateCut?: string // is this a number?
  aScore?: number

  bypassRiskCheck?: boolean

  rainCredited?: number
  surveyCredited?: number
  roowardsBonus?: boolean | number // This kind of type mixing is gross, but will be addressed in upcoming tickets
  roowardsDisabled?: boolean
  roowardsClaimed?: number
  rechargeClaimed?: number
  manualBonuses?: number
  kycLevel?: KYCLevel
  isSponsor?: boolean
  twofactorEnabled?: boolean
  twofactorEnabledAt?: string
  howieDeal?:
    | {
        percent?: number
        total?: number | false
        remaining?: number | false
      }
    | false
  product?: 'Sportsbook' | 'Casino' | ''
  rechargeGiven?: number

  /** user/lib/lock */
  lockedUntil?: string | null
  lockReason?: string

  isPromoBanned?: boolean
  hasMatchPromoActive?: boolean

  dailyWithdrawLimit?: number

  intercomUpdate?: true

  // legacy
  maxWithdraw?: number
  specialTipSender?: boolean
  affiliateLocked?: boolean
  bypassAffiliateRequirements?: boolean
  chatMessages?: number

  postback?: {
    offerComplete: boolean
    transactionId: string
    transactionSource: string
    subId: string
  }

  // KYC.
  kyc?: KYCGet

  // Balances
  balances: UserBalance

  // RBAC
  rules: string[]
  // User Games
  favoriteGames: TPGame[]
  recentGames: TPGame[]

  // User Wallets/Tags
  rippleDestinationTag: RippleDepositInfo

  socketToken: string
  fasttrackToken: string

  // System Settings
  systemSettings: {
    totalDeposited: number
    totalDeposits: number
    totalTipped: number
    totalTipsReceived: number
    totalWithdrawn: number
    totalWon: number
    twofactorEnabled: boolean
    twofactorEnabledAt: string
    userKYCOverrideLevel: number
    user_hash: string
    currency: {
      displayCurrency: DisplayCurrency
      hideEmptyBalances: boolean
    }
    feed: {
      incognito: boolean
    }
    profile: {
      editable: {
        maskSensitiveData: boolean
        showProfileInfo: boolean
      }
    }
  } & Record<
    string,
    {
      enabled: boolean
      volume: number
    }
  >

  security: {
    hasSteam: boolean
    hasMetamask: boolean
    hasGoogle: boolean
  }

  exchangeRates: Record<DisplayCurrency, { rate: number; symbol: string }>
  mutes: object[]
  matchPromo?: MatchPromoProps
  adminLookups?: LookupRecord[]
}
