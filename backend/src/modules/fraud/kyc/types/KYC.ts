import { type KycVerificationLevelResult } from './Verification'

/** These KYC levels require verification */
export const VerifiedKYCLevels = [1, 2, 3, 4] as const
export type VerifiedKYCLevel = (typeof VerifiedKYCLevels)[number]
export const isVerifiedKYCLevel = (value: any): value is VerifiedKYCLevel =>
  VerifiedKYCLevels.includes(value)

/** There is code that takes users to level 0 */
const KYCLevels = [0, ...VerifiedKYCLevels] as const
export type KYCLevel = (typeof KYCLevels)[number]
export const isKYCLevel = (value: any): value is KYCLevel =>
  KYCLevels.includes(value)

export type KYCLevelStatus = 'incomplete' | 'pending' | 'rejected' | 'complete'

export interface KYCLevelData {
  status: KYCLevelStatus
  error?: string
}

export type KYCLevelsData = Record<VerifiedKYCLevel, KYCLevelData>

export type ManualLevelVerification = Record<VerifiedKYCLevel, boolean>

export interface KYCRecord {
  _id: string
  userId: string
  firstName?: string
  lastName?: string
  phone?: string
  phoneVerified?: boolean
  dob?: string
  sourceOfFunds: string
  legacyAddress: string
  legacyName: string
  validationResults: KycVerificationLevelResult[]
  levels: KYCLevelsData
  addressCity?: string
  addressCountry?: string
  addressLine1?: string
  addressLine2?: string
  addressPostalCode?: string
  addressState?: string
  rejected?: boolean
  manualLevelVerification?: ManualLevelVerification
  georestricted: boolean
  kycRequiredReason?: string
  kycRestrictAccount?: boolean
  createdAt: string
  updatedAt: string
}
