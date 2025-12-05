import { type CountryCodeEnum } from 'src/util/types'
import { type WithRequiredProperties } from 'src/util/helpers/types'
import { type KYCLevel } from 'src/modules/fraud/kyc'
import { type LegacySystemKey } from 'src/modules/siteSettings'
import { type UserId } from 'src/util/types/userId'

import { type BalanceType, type SelectedBalanceField } from './Balance'

const LegacyUserRoles = ['VIP', 'HV', ''] as const
export type LegacyUserRole = (typeof LegacyUserRoles)[number]
export const isLegacyUserRole = (value: any): value is LegacyUserRole =>
  LegacyUserRoles.includes(value)

const CustomerRoles = ['CS', 'PL', 'PLI', ''] as const
export type CustomerRole = (typeof CustomerRoles)[number]
export const isCustomerRole = (value: any): value is CustomerRole =>
  CustomerRoles.includes(value)

export type AssignableUserRoles = LegacyUserRole | CustomerRole

export type UserRole = string

const Products = ['Sportsbook', 'Casino', ''] as const
export type Product = (typeof Products)[number]
export const isProduct = (value: any): value is Product =>
  Products.includes(value)

const Managers = [
  'Katy',
  'Gustavo',
  'Barry',
  'Natalia',
  'Liviu',
  'Carlos',
  'Michael',
  'Alisa',
] as const
/** We do not put this as a type on User because there are past managers that are on user records */
export const isValidManagerInput = (
  value: string,
): value is (typeof Managers)[number] =>
  (Managers as readonly string[]).includes(value)

const Departments = [
  'Dev',
  'Marketing',
  'Risk',
  'Compliance',
  'Finance',
  'VIP',
  'Support',
  'Gaming',
  '',
] as const
export type Department = (typeof Departments)[number]
export const isDepartment = (value: any): value is Department =>
  Departments.includes(value)

export interface AdminLookup {
  id: string
  index: 'nameLowercase' | 'id' | 'email' | 'name'
  key: string
}

export type DBUser = {
  id: UserId

  // Since we sometimes set countryCode with external services, we can't be sure that our CountryCodeEnum is definitive
  countryCode: CountryCodeEnum | string
  createdAt: Date
  email: string
  emailVerified?: boolean
  lastLogin: Date
  name: string
  nameLowercase: string

  // Roles.
  staff?: boolean

  hasChatModBadge?: boolean
  hasChatDevBadge?: boolean
  isChatMod?: boolean
  adminLookups?: AdminLookup[]

  // balance info
  balance?: number
  ethBalance?: number
  ltcBalance?: number
  cashBalance?: number

  marketingBonus?: number
  chatLabel?: string
  level?: number
  locale?: string
  totalDeposited?: number
  totalDeposits?: number
  authNonce?: number
  role?: LegacyUserRole | CustomerRole
  roles?: UserRole[]
  totalWon?: number
  totalWithdrawn?: number
  totalEarnings?: number
  invalidLoginAttempts?: number
  lastDeposit?: Date // rethink timestamp
  lastBet?: Date
  mustSetName?: boolean
  department?: Department
  profileIsPrivate?: boolean
  isMarketing?: boolean
  manager?: string
  kycRequiredLevel?: KYCLevel | `${KYCLevel}` // TODO: Why are we using strings?
  lastFingerprint?: Date

  // Bet Goals
  betGoal?: number // Bitcoin
  ethBetGoal?: number
  ltcBetGoal?: number
  cashBetGoal?: number

  totalTipped?: number
  totalTipsReceived?: number
  hiddenTotalWithdrawn?: number
  hiddenTotalDeposited?: number
  hiddenTotalDeposits?: number
  hiddenTotalBet?: number
  hiddenTotalWon?: number
  hiddenTotalBets?: number
  offerDeposits?: number
  offerDeposited?: number
  promosClaimed?: number
  lastPromoClaimed?: Date
  hiddenSportsTotalBet?: number
  hiddenSportsTotalWon?: number
  hiddenSportsTotalBets?: number

  /** Tracks what currency (cash or crypto) the user is betting with. */
  selectedBalanceField?: SelectedBalanceField

  /** user referrals */
  referralEarnings?: number
  refCount?: number
  affiliateId?: string
  affiliateUnpaid?: number
  customAffiliateCut?: number | false
  affiliateCut?: string // is this a number?
  aScore?: number

  /** Allows a user to withdraw without being subject to the crypto risk check. */
  bypassRiskCheck?: boolean

  rainCredited?: number
  surveyCredited?: number
  roowardsBonus?: boolean | number // This kind of type mixing is gross, but will be addressed in upcoming tickets
  roowardsDisabled?: boolean
  roowardsClaimed?: number
  rechargeClaimed?: number
  manualBonuses?: number
  lastManualBonus?: Date // maybe a string idfk
  kycLevel?: KYCLevel
  isSponsor?: boolean
  isWhale?: boolean
  twofactorEnabled?: boolean
  twofactorEnabledAt?: Date
  howieDeal?:
    | {
        percent?: number
        total?: number | false
        remaining?: number | false
      }
    | false
  product?: Product
  rechargeGiven?: number

  lockedUntil?: string | null
  lockReason?: string

  isPromoBanned?: boolean
  hasMatchPromoActive?: boolean

  dailyWithdrawLimit?: number | false

  intercomUpdate?: true

  // TODO run a backfill to remove these fields from the users table.
  /** @deprecated */
  maxWithdraw?: number
  /** @deprecated */
  specialTipSender?: boolean
  /** @deprecated */
  chatLocale?: 'en' | 'balkan'
  /** @deprecated */
  affiliateLocked?: boolean
  /** @deprecated */
  bypassAffiliateRequirements?: boolean
  /** @deprecated */
  chatMessages?: number
  /** @deprecated */
  sept14Bonus?: boolean
  /** @deprecated */
  bitcoinNodeId?: string
  /** @deprecated */
  overridePaths?: Record<string, boolean>

  postback?: {
    offerComplete: boolean
    transactionId: string
    transactionSource: string
    subId: string
  }

  bearerAuth?: boolean
} & Partial<Record<LegacySystemKey, boolean>> // legacy disables

export interface User
  extends WithRequiredProperties<
    DBUser,
    | 'hiddenTotalDeposited'
    | 'hiddenTotalDeposits'
    | 'hiddenTotalWithdrawn'
    | 'hiddenTotalBet'
    | 'hiddenTotalBets'
    | 'balance'
    | `${'eth' | 'ltc' | 'cash'}Balance`
    | 'hiddenTotalWon'
    | 'totalTipped'
    | 'totalTipsReceived'
    | 'offerDeposits'
    | 'offerDeposited'
    | 'promosClaimed'
    | 'refCount'
    | 'affiliateUnpaid'
  > {
  /**
   * @deprecated use selectedBalanceType instead
   */
  selectedBalanceField?: SelectedBalanceField
  kycRequiredLevel: KYCLevel
  selectedBalanceType: BalanceType
}

export type SanitizedUser = Pick<
  User,
  | 'id'
  | 'name'
  | 'lastLogin'
  | 'refCount'
  | 'referralEarnings'
  | 'totalEarnings'
>
export type DisplayUser = Pick<
  User,
  'chatLabel' | 'name' | 'hasChatModBadge' | 'hasChatDevBadge'
> & { id: UserId | 'hidden' | 'Announcement' }
