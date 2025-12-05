import {
  type KYCGet,
  type User,
  type UserDocument,
  type VerifiedKYCLevel,
} from 'common/types'

export interface KYCGetForUserResponse {
  kyc: KYCGet
  documents: Array<
    UserDocument & {
      reviewer?: string
    }
  >
  user: User & { deletedAt?: string }
}

export type KYCLevelWithDocuments = Exclude<VerifiedKYCLevel, 1>

export type DocumentType = 'identity' | 'address' | 'sof'
