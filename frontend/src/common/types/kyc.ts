import { type KYCLevelsData } from 'app/components/KycForms/types'

/** These KYC levels require verification */
export const VerifiedKYCLevels = [1, 2, 3, 4] as const
export type VerifiedKYCLevel = (typeof VerifiedKYCLevels)[number]
/** There is code that takes users to level 0 */
export const KYCLevels = [0, ...VerifiedKYCLevels] as const
export type KYCLevel = (typeof KYCLevels)[number]
export const isKYCLevel = (value: any): value is KYCLevel =>
  KYCLevels.includes(value)

export interface KycVerificationFailure {
  error: string
  field?: string
}
export interface KycVerificationLevelResult {
  verified: boolean
  level: KYCLevel
  failures: KycVerificationFailure[]
  reject?: boolean
  pending?: boolean
}

export interface KYCRecord {
  _id: string
  userId: string
  firstName?: string
  lastName?: string
  phone?: string
  phoneVerified?: boolean
  dob?: string
  sourceOfFunds: string
  validationResults?: KycVerificationLevelResult[]
  levels: KYCLevelsData
  addressCity?: string
  addressCountry?: string
  addressLine1?: string
  addressLine2?: string
  addressPostalCode?: string
  addressState?: string
  rejected?: boolean
  manualLevelVerification?: Record<VerifiedKYCLevel, boolean>
  createdAt: string
  updatedAt: string
  georestricted: boolean
  kycRequiredReason?: string
  kycRestrictAccount?: boolean
}

export interface KycNeededResponse {
  neededKycLevel: KYCLevel
  kycLevel: KYCLevel
  needsKycUpgrade?: boolean
  shouldLockBets?: boolean
}

export type KYCGet = Partial<KYCRecord & KycNeededResponse> & {
  kycLevel: KYCLevel
  kyc?: KYCRecord
  rejectedReasons?: string[]
  georestricted: boolean
}

export const DocumentStatuses = [
  'approved',
  'rejected',
  'in_review',
  'escalated',
  'flagged',
] as const
export type DocumentStatus = (typeof DocumentStatuses)[number]
export const DocumentStatusLabels: Record<DocumentStatus, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  in_review: 'In Review',
  escalated: 'Escalated',
  flagged: 'Flagged',
}

export interface UserDocument {
  _id: string
  type: string
  key: string
  uniqueKey?: string
  status: DocumentStatus
  autoRejected?: boolean
  totalDeposited?: number
  totalWithdrawn?: number
  userId: string
  shuftiCallbackResponse?: any
  reviewedBy?: string
  reviewedAt?: string
  deleted?: boolean
  deletedAt?: string
  createdAt: string
  updatedAt: string
}
