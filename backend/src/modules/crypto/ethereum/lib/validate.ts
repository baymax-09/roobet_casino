import { type TransactionReceipt } from 'web3-core'

import { cryptoLogger } from '../../lib/logger'
import { ReasonCodes } from 'src/modules/deposit'
import { type DepositStatus } from 'src/modules/deposit/types'

export function validateEthereumTransactionForDeposit(
  receipt: TransactionReceipt,
): {
  status: Extract<DepositStatus, 'pending' | 'cancelled'>
  reason?: string
} {
  const logger = cryptoLogger(
    'ethereum/validateEthereumTransactionForDeposit',
    { userId: receipt.from },
  )
  try {
    /*
     * If false, then it means the Ethereum Virtual Machine reverted the transaction.
     */
    if (!receipt.status) {
      logger.info(`Canceled Ethereum Transaction - Receipt: ${receipt}`, {
        receipt,
      })
      return {
        status: 'cancelled',
        reason: ReasonCodes.NO_TRANSACTION.message,
      }
    }
  } catch (error) {
    logger.error(
      `Confirm Ethereum Transaction: ${receipt.transactionHash} - ${error.message}`,
      { receipt },
      error,
    )
  }

  return {
    status: 'pending',
  }
}
