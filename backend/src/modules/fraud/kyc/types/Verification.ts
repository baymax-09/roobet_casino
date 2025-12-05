import { type KYCLevelData, type KYCRecord, type KYCLevel } from './KYC'
import { type VerifiedKYCLevel } from '../types'

export interface KycVerificationFailure {
  error: string
  field?: string
}

export interface KycVerificationResult {
  validationResult: KycVerificationLevelResult
  level: KYCLevelData
}

export interface KycVerificationLevelResult {
  verified: boolean
  level: VerifiedKYCLevel
  failures: KycVerificationFailure[]
  reject?: boolean
  pending?: boolean
}

export interface KycNeededResponse {
  neededKycLevel: KYCLevel
  kycLevel: KYCLevel
  needsKycUpgrade?: boolean
  shouldLockBets?: boolean
}

export interface KycValidationResponse {
  validationResults: KycVerificationLevelResult[]
  kycLevel: KYCLevel
  newKyc: KYCRecord
}
