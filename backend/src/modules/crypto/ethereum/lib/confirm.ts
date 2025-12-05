import type Web3 from 'web3'

import { cryptoLogger } from '../../lib/logger'
import {
  ReasonCodes,
  DepositStatuses,
  updateDepositTransaction,
  cancelDepositTransaction,
} from 'src/modules/deposit'
import { type Deposit } from 'src/modules/deposit/documents/deposit_transactions_mongo'

export function calculateConfirmations(
  currentBlockNumber: number,
  blockNumber: number | null,
  confirmations: number,
): number {
  if (blockNumber) {
    const newConfirmations = currentBlockNumber - blockNumber
    return newConfirmations
  }

  return confirmations
}

export async function confirmPendingDeposit(
  web3: Web3,
  deposit: Deposit,
  currentBlockNumber: number,
): Promise<number> {
  const confirmations = deposit.confirmations || 0
  const logger = cryptoLogger('ethereum/confirmPendingDeposit', {
    userId: deposit.userId,
  })
  if (!deposit.externalId) {
    return confirmations
  }

  try {
    const receipt = await web3.eth.getTransactionReceipt(deposit.externalId)

    // Is the transaction still pending?
    if (!receipt) {
      await updateDepositTransaction({
        _id: deposit._id,
        status: DepositStatuses.Pending,
        confirmations,
      })
      return confirmations
    }

    /*
     * If false, then it means the Ethereum Virtual Machine reverted the transaction.
     */
    if (!receipt.status) {
      await cancelDepositTransaction(
        deposit._id,
        ReasonCodes.NO_TRANSACTION.message,
      )
      logger.error(`canceledEthereumTransaction - Deposit: ${deposit}`, {
        deposit,
        receipt,
      })
      return deposit.confirmations || 0
    }
    const calculatedConfirmations = calculateConfirmations(
      currentBlockNumber,
      receipt.blockNumber,
      confirmations,
    )

    logger.info(
      `Transaction with hash ${deposit.externalId} has ${calculatedConfirmations} confirmation(s)`,
      { deposit, receipt },
    )

    /*
     * Update the deposit transaction to reflect a status of Pending and the
     * current number of confirmations.
     */
    await updateDepositTransaction({
      _id: deposit._id,
      status: DepositStatuses.Pending,
      confirmations: calculatedConfirmations,
    })
    return calculatedConfirmations
  } catch (error) {
    logger.error(
      `Deposit error for ${deposit._id} - ${error.message}`,
      { deposit },
      error,
    )
    process.exit(0)
  }
}
