import { poolingTransactionHooks } from './pool'
import { approveTransactionHooks } from './approve'
import { withdrawalTransactionHooks } from './withdraw'
import { fundEthTransactionHooks } from './fund'

import { Process, type TransactionQueueHook } from '../types'

export const hooks: Record<Process, TransactionQueueHook<any>> = {
  [Process.FUND_ETH]: {
    ...fundEthTransactionHooks,
  },
  [Process.APPROVE_ERC20]: {
    ...approveTransactionHooks,
  },
  [Process.POOLING]: {
    ...poolingTransactionHooks,
  },
  [Process.WITHDRAWAL]: {
    ...withdrawalTransactionHooks,
  },
}
