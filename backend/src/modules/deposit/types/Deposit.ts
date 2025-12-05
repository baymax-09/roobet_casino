import * as t from 'io-ts'

import {
  type Crypto,
  CryptoLowercaseV,
  isValidLowercaseCrypto,
  CryptoSymbolsV,
  CryptoNetworkV,
} from 'src/modules/crypto/types'
import { type BalanceType } from 'src/modules/user/balance'
import { createObjectFromArray } from 'src/util/helpers/lists'

export type CashDepositKey = 'PaymentIq'
export type CryptoDepositKey = Crypto

export type DepositKeys = CashDepositKey | CryptoDepositKey | 'Test'

export type CryptoDepositType = t.TypeOf<typeof CryptoLowercaseV>
export const isValidCryptoDepositType = isValidLowercaseCrypto

const CashDepositTypesV = t.literal('paymentIq')
export type CashDepositType = t.TypeOf<typeof CashDepositTypesV>
export const DepositTypeV = t.union([
  CryptoLowercaseV,
  CashDepositTypesV,
  t.literal('test'),
])
export type DepositType = t.TypeOf<typeof DepositTypeV>

export const DepositStatuses = [
  'initiated',
  'pending',
  'cancelled',
  'failed',
  'declined',
  'completed',
] as const
export const DepositStatusV = t.keyof(createObjectFromArray(DepositStatuses))
export type DepositStatus = t.TypeOf<typeof DepositStatusV>
export const isValidDepositStatus = (value: any): value is DepositStatus =>
  DepositStatusV.is(value)

export const DepositMetaV = t.record(t.string, t.any)
export type DepositMeta = t.TypeOf<typeof DepositMetaV>

export const DepositSecretsV = t.record(t.string, t.any)
export type DepositSecrets = t.TypeOf<typeof DepositSecretsV>

export const BaseDepositV = t.intersection([
  t.type({
    id: t.string,
    amount: t.number,
    status: DepositStatusV,
    userId: t.string,
    /** These 3 fields are necessary because currency currently only denotes USD
     * Ideally, "depositType" is deprecated in place of currency representing the crypto token
     * and the "network" representing the crypto network where the token is held
     */
    network: CryptoNetworkV,
    depositType: DepositTypeV,
    currency: t.union([CryptoSymbolsV, t.literal('usd')]),
  }),
  t.partial({
    reason: t.string,
    externalId: t.string,
    tracked: t.boolean,
    meta: DepositMetaV,
    secrets: DepositSecretsV,
    confirmations: t.number,
  }),
])
export type BaseDeposit = t.TypeOf<typeof BaseDepositV>

export const CryptoDepositTypeToBalanceType: Record<
  CryptoDepositType,
  Exclude<BalanceType, 'cash'>
> = {
  bitcoin: 'crypto',
  ethereum: 'eth',
  litecoin: 'ltc',
  tether: 'usdt',
  usdc: 'usdc',
  ripple: 'xrp',
  dogecoin: 'doge',
  tron: 'trx',
}
