export interface VerifyUserRequest {
  sessionId: string
  userId: string
}

export interface VerifyUserResponse {
  userId: string
  success: boolean
  userCat?: string
  kycStatus?: string
  sex?: string
  firstName?: string
  lastName?: string
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  email?: string
  dob?: string
  mobile?: string
  balance?: number
  balanceCy?: string
  locale?: string
  attributes?: {
    allow_manual_payout: string // boolean string
  }
  errCode?: string
  errMsg?: string
}
