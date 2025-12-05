import { type BetHistoryDocument } from 'src/modules/bet/types'
import { type Types as UserTypes } from 'src/modules/user'

import { type HouseGamesWithVerification } from '.'

export interface VerificationError {
  code: number
  message: string
}

export interface VerifyData<T extends HouseGamesWithVerification> {
  user: UserTypes.User
  gameName: T
  betId: string
  bet: BetHistoryDocument
}

export interface VerificationResults {
  serverSeed: string
  hashedServerSeed: string | null
  nonce?: number | null
  clientSeed: string | undefined
  result: any
}

export interface CoinflipVerificationResults extends VerificationResults {
  blockHeight: number
  hashForOtherPlayer: {
    gameFinalHash: string
  }
}

export type VerificationFunctionResult =
  | VerificationResults
  | CoinflipVerificationResults
  | VerificationError

export const isVerificationError = (obj: any): obj is VerificationError =>
  'code' in obj

export type VerificationFunction<T extends HouseGamesWithVerification> = (
  data: VerifyData<T>,
) => Promise<VerificationFunctionResult>

export type VerificationLookup = {
  [key in HouseGamesWithVerification]: VerificationFunction<key>
}
