import { type KYCGet, type VerifiedKYCLevel } from 'common/types'

export interface KYCFormProps {
  kyc: KYCGet
  proceed: () => void
}

export interface KYCLevelData {
  status: KYCLevelStatus
  error?: string
}

export type KYCLevelsData = Record<VerifiedKYCLevel, KYCLevelData>

export type KYCLevelStatus = 'incomplete' | 'pending' | 'rejected' | 'complete'

export type KYCStatus = 'unavailable' | KYCLevelStatus
