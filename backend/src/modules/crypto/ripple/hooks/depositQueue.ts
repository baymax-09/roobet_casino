import { type DepositQueueHooks } from 'src/modules/deposit/types'

import { type RippleTransaction } from '../types'
import { cryptoLogger } from '../../lib/logger'

export const DepositHooks: DepositQueueHooks<RippleTransaction> = {
  checkConfirmations: async (depositPayload, transaction) => {
    // checking confirmations is pretty straight forward for ripple, so we'll just do it here
    // after 1 new ledger is published, all previous ledgers become permanent
    const { result } = transaction
    return result.validated ? 1 : 0
  },
  postCryptoHooks: async depositPayload => {},
  onError: async ({ transaction, depositPayload, error }) => {
    cryptoLogger('ripple/onError', { userId: depositPayload.user.id }).error(
      `Ripple DepositHooks onError - ${error.message}`,
      error,
    )
  },
}
