import { type Currency } from 'src/modules/currency/types'
import { type PaymentProvider, type PaymentMethod } from './PaymentProvider'
import { type VerifyUserResponse } from './VerifyUser'

export interface AuthorizeRequest {
  userId: string
  maskedAccount?: string
  accountHolder?: string
  txAmount: string
  txAmountCy: Currency
  txId: string
  txTypeId: string
  txName: PaymentMethod
  provider: PaymentProvider
  attributes?: {
    cardExpiry?: string
    cardBin?: number
    cardIssuer?: string
    cardHolder?: string
    merchantTxId?: string
    nationalId?: string
    pspAccount?: string
  }
}

export interface AuthorizeResponse {
  userId: string
  success: boolean
  merchantTxId: string
  authCode: string
  errCode?: string
  errMsg?: string
  updatedUser?: Partial<VerifyUserResponse>
}
