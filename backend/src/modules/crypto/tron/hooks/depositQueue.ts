import { config } from 'src/system'
import { scopedLogger } from 'src/system/logger'
import { type DepositQueueHooks } from 'src/modules/deposit/types'

import {
  type TronToken,
  type Transaction,
  type TRC20Token,
  TronAddressBase58V,
  isTRC20Token,
} from '../types'
import { createWalletBalance } from '../documents/tron_balances'
import { type CryptoLowercase } from '../../types'

const tronLogger = scopedLogger('tron-depositQueue-hooks')

const getTronToken = (
  type: CryptoLowercase,
): TronToken | TRC20Token | undefined => {
  if (type === 'tron') {
    return 'trx'
  } else if (type === 'tether') {
    return 'usdt'
  } else if (type === 'usdc') {
    return 'usdc'
  }
}

export const DepositHooks: DepositQueueHooks<Transaction> = {
  // we should only be processing deposits for transactions that are confirmed, but this is a final check
  checkConfirmations: async (depositPayload, transaction) => {
    const { minConfirmations } = config.tron.deposit
    return minConfirmations
  },
  postCryptoHooks: async depositPayload => {
    const logger = tronLogger('postCryptoHooks', { userId: null })
    const { recipientId, depositType } = depositPayload
    const isValidRecipient = TronAddressBase58V.is(recipientId)
    const token = getTronToken(depositType)
    if (!isValidRecipient) {
      logger.error('Receipient address is unrecognized type', { recipientId })
      return
    }

    if (isTRC20Token(token)) {
      await createWalletBalance({
        token,
        address: recipientId,
        actionRequired: 'fund',
        processing: false,
      })
    } else {
      await createWalletBalance({
        token: 'trx',
        address: recipientId,
        actionRequired: 'pool',
        processing: false,
      })
    }
  },
  onError: async ({ transaction, depositPayload, error }) => {
    const logger = tronLogger('onError', { userId: null })
    logger.error('hooks unknown error', { transaction, depositPayload }, error)
  },
}
