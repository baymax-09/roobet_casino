import { type ErrorCode } from './enums'
import { type BetRespFields } from './transactions/bet'
import { type BonusWinRespFields } from './transactions/bonusWin'
import { type EndRoundRespFields } from './transactions/endRound'
import { type RefundRespFields } from './transactions/refund'
import { type ResultRespFields } from './transactions/result'

export type PragmaticSuccessStatusResp<T> = {
  error: 0
  description: string
} & T

export interface PragErrorResponse {
  error: ErrorCode
  description: string
}

export type ResponsePayloads =
  | BetRespFields
  | BonusWinRespFields
  | RefundRespFields
  | ResultRespFields
  | EndRoundRespFields
export type ProcessResult<T> = PragmaticSuccessStatusResp<T> | PragErrorResponse

export type TransactionProcessResult<T> = ProcessResult<T> & {
  transactionId: string
}
