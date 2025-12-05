import { TronPoolingHooks } from './pool'
import { TronWithdrawHooks } from './withdraw'
import { type Process } from '../../../types'

type TronOutboundTransactionMap = Record<
  Extract<Process, 'withdrawal' | 'pooling'>,
  any
>

export const TronOutboundTransactionHooks: TronOutboundTransactionMap = {
  withdrawal: TronWithdrawHooks,
  pooling: TronPoolingHooks,
}
