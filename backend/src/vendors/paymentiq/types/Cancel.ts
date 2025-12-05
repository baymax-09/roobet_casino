import { type PaymentProvider, type PaymentMethod } from './PaymentProvider'

export interface CancelRequest {
  userId: string
  authCode: string
  txAmount: string
  txAmountCy: string
  txId: string
  txTypeId: string
  txName: PaymentMethod
  provider: PaymentProvider
  statusCode: string
  pspStatusCode: string
  pspStatusMessage: string
  attributes?: {
    info?: string
  }
}

export interface CancelResponse {
  userId: string
  success: boolean
  errCode?: string
  errMsg?: string
}
