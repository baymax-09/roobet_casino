import * as t from 'io-ts'

import { DepositQueuePayloadV } from 'src/modules/deposit/types'
import { type User } from 'src/modules/user/types'

const TronDepositV = t.intersection([
  DepositQueuePayloadV,
  t.type({
    currency: t.literal('usd'),
    depositType: t.union([
      t.literal('tron'),
      t.literal('tether'),
      t.literal('usdc'),
    ]),
    cryptoType: t.union([
      t.literal('Tron'),
      t.literal('Tether'),
      t.literal('USDC'),
    ]),
  }),
])
export type TronDeposit = t.TypeOf<typeof TronDepositV> & { user: User }
