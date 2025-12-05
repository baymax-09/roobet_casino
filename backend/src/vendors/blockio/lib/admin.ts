import { type BlockioNetwork, type BlockioTransaction } from 'block_io'

import { config } from 'src/system'
import { useBlockioApi } from 'src/vendors/blockio/lib/api'
import {
  isBlockioCryptoSymbol,
  BlockioCryptoSymbolList,
  type BlockioCryptoSymbol,
} from 'src/modules/crypto/types'
import { isRoleAccessPermitted } from 'src/modules/rbac'
import { type Types } from 'src/modules/user'

import { processTransactionForCrypto } from 'src/vendors/blockio/lib/transaction'

const blockioCryptosToNetwork: Record<BlockioCryptoSymbol, BlockioNetwork> = {
  btc: 'BTC',
  ltc: 'LTC',
  doge: 'DOGE',
}

interface UpdateBlockioTransactionParams {
  transactionId: string
  crypto: string
  forcedReprocess: boolean
}

export const updateBlockioTransaction = async (
  data: UpdateBlockioTransactionParams,
  user: Types.User,
): Promise<{ success: boolean; error?: string }> => {
  const { transactionId, crypto, forcedReprocess } = data

  const authorized = await isRoleAccessPermitted({
    user,
    requests: [{ resource: 'deposits', action: 'dangerously_update' }],
  })

  if (forcedReprocess && !authorized) {
    return { success: false, error: 'Permission Denied' }
  }

  if (typeof transactionId !== 'string') {
    return { success: false, error: 'pass transactionId param' }
  }
  if (!crypto) {
    return { success: false, error: 'pass crypto param' }
  }
  if (!isBlockioCryptoSymbol(crypto)) {
    return {
      success: false,
      error: `crypto must be one of "${BlockioCryptoSymbolList.join(',')}"`,
    }
  }

  // offset by 4 days
  const transactionLimitDays = config.crypto.transactionLimitDays - 4

  const blockIoApi = useBlockioApi(crypto)
  const transaction = await blockIoApi.getTransaction(transactionId)
  const transactionDate = new Date(transaction.time * 1000)
  const daysAgo = new Date(
    Date.now() - transactionLimitDays * 24 * 60 * 60 * 1000,
  )

  if (daysAgo > transactionDate) {
    return { success: false, error: 'transaction is too old' }
  }

  for (const output of transaction.outputs) {
    // @ts-expect-error need to see if this is string or number out of the block_io lib
    if (output.value > 0) {
      const payload: BlockioTransaction = {
        address: output.address,
        balance_change: output.value,
        amount_received: output.value,
        txid: transactionId,
        confirmations: transaction.confirmations,
        amount_sent: '0',
        network: blockioCryptosToNetwork[crypto],
      }
      await processTransactionForCrypto(crypto, payload, !!forcedReprocess)
    }
  }
  return { success: true }
}
