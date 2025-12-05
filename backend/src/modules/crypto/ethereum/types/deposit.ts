import * as t from 'io-ts'
import { date } from 'io-ts-types'

import { type User } from 'src/modules/user/types'
import { ObjectIdV } from 'src/util/types/ids'

import {
  EthereumCryptoProperNameV,
  EthereumCryptoProperNameLowercaseV,
  ETHTokenV,
} from './enums'

export const EthereumWalletV = t.type({
  _id: ObjectIdV,
  id: t.string,
  address: t.string,
  nonce: t.number,
  // TODO use UserIdT
  userId: t.string,
  hasBalance: t.boolean,
  createdAt: date,
  updatedAt: date,
})

export type EthereumWallet = t.TypeOf<typeof EthereumWalletV>

export const EthereumDepositV = t.intersection([
  t.type({
    wallet: EthereumWalletV,
    depositAmountUSD: t.number,
    currency: t.union([ETHTokenV, t.literal('usd')]),
    depositType: EthereumCryptoProperNameLowercaseV,
    cryptoType: EthereumCryptoProperNameV,
    depositId: t.string,
    externalId: t.string,
    /** recipient wallet address */
    recipientId: t.string,
    meta: t.type({
      txHash: t.string,
      toAddress: t.string,
    }),
  }),
  t.partial({
    forcedReprocess: t.boolean,
  }),
])

export type EthereumDeposit = t.TypeOf<typeof EthereumDepositV> & { user: User }
