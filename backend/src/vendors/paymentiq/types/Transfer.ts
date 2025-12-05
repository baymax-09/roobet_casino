import { type PaymentProvider, type PaymentMethod } from './PaymentProvider'

export interface TransferRequest {
  userId: string
  txAmount: string
  txAmountCy: string
  txPspAmount: string
  txPspAmountCy: string
  fee: string
  feeCy: string
  txId: string
  txTypeId: string
  txName: PaymentMethod
  provider: PaymentProvider
  txRefId: string
  pspStatusMessage: string
  attributes?: {
    info?: string
  }
}

export interface TransferResponse {
  userId: string
  success: boolean
  txId: string
  merchantTxId: string
  errCode?: string
  errMsg?: string
}
