import * as t from 'io-ts'

import { type User } from 'src/modules/user/types'

import { DepositQueuePayloadV } from 'src/modules/deposit/types'

export const RippleDepositV = t.intersection([
  DepositQueuePayloadV,
  t.type({
    currency: t.union([t.literal('xrp'), t.literal('usd')]),
    depositType: t.literal('ripple'),
    cryptoType: t.literal('Ripple'),
  }),
])
export type RippleDeposit = t.TypeOf<typeof RippleDepositV> & { user: User }
