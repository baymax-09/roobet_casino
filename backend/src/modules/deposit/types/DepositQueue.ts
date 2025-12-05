import * as t from 'io-ts'
import { type Types } from 'mongoose'

import {
  CryptoLowercaseV,
  CryptoV,
  CryptoSymbolsV,
  type CryptoTransaction,
  type CryptoNetwork,
} from 'src/modules/crypto/types'
import { type User } from 'src/modules/user/types'
import { ObjectIdV } from 'src/util/types/ids'

export const DepositQueuePayloadV = t.intersection([
  t.type({
    depositAmountUSD: t.number,
    currency: t.union([CryptoSymbolsV, t.literal('usd')]),
    depositType: CryptoLowercaseV,
    cryptoType: CryptoV,
    depositId: t.string,
    externalId: t.string,
    /** destination wallet address */
    recipientId: t.string,
    meta: t.type({
      txHash: t.string,
      /** destination wallet address */
      toAddress: t.string,
    }),
  }),
  t.partial({
    forcedReprocess: t.boolean,
  }),
])

export type DepositQueuePayload = t.TypeOf<typeof DepositQueuePayloadV> & {
  user: User
}

export type SupportedNetwork = Extract<CryptoNetwork, 'Tron' | 'Ripple'>
export const isSupportedNetwork = (
  network: CryptoNetwork,
): network is SupportedNetwork => network === 'Tron' || network === 'Ripple'

export interface CryptoDepositQueueMessage {
  deposits: Array<{
    deposit: DepositQueuePayload
    transaction: CryptoTransaction
  }>
  network: CryptoNetwork
}

export const CompleteDepositPayloadV = t.intersection([
  DepositQueuePayloadV,
  t.type({
    confirmations: t.number,
    depositMongoId: ObjectIdV,
  }),
])

type CompleteDepositPayload = t.TypeOf<typeof CompleteDepositPayloadV> & {
  user: User
}

export type DepositQueueMessage = CryptoDepositQueueMessage & {
  attempts?: number
}

export interface DepositQueueHooks<T extends CryptoTransaction> {
  checkConfirmations: (
    depositPayload: DepositQueuePayload,
    transaction: T,
  ) => Promise<number>
  postCryptoHooks: (depositPayload: CompleteDepositPayload) => Promise<void>

  onError: ({
    transaction,
    depositPayload,
    error,
  }: {
    transaction: T
    depositPayload: DepositQueuePayload
    error: Error
  }) => Promise<void>
}

export interface GenericDepositHooks {
  validationChecks: (depositPayload: DepositQueuePayload) => Promise<boolean>
  startDeposit: (
    depositPayload: DepositQueuePayload,
    network: CryptoNetwork,
  ) => Promise<Types.ObjectId | null>
  riskCheck: (depositPayload: CompleteDepositPayload) => Promise<boolean>
  completeDeposit: (depositPayload: CompleteDepositPayload) => Promise<void>
  postProcessingHooks: (depositPayload: CompleteDepositPayload) => Promise<void>

  onError: ({
    depositPayload,
    error,
  }: {
    depositPayload: DepositQueuePayload
    error: Error
  }) => Promise<void>
}
