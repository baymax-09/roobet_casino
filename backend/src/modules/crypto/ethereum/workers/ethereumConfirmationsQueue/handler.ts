import { sleep } from 'src/util/helpers/timer'

import { hooks } from '../../hooks'
import { type ConfirmationsQueueMessage, QueuePriority } from '../../types'
import {
  publishConfirmEthereumTransactionEvent,
  publishSendEthereumTransactionEvent,
} from '../../rabbitmq'
import { cryptoLogger } from 'src/modules/crypto/lib/logger'

const { BUMP_PRIORITY } = QueuePriority

const TIMEOUT = 15000 // 15 second

/**
 * All outbound transactions are confirmed through this queue. If a transaction is not confirmed
 * by the time the queue messsage is processed, it is re-broadcast with a higher gas price.
 * @param message | ConfirmationsQueueMessage
 * @returns Promise<void>
 */
export const confirmPendingTransaction = async ({
  message,
  transactionHash,
}: ConfirmationsQueueMessage): Promise<void> => {
  const logger = cryptoLogger('ethereum/workers/confirmPendingTransaction', {
    userId: null,
  })
  // Give time for the transaction to get picked up and added to a block
  await sleep(TIMEOUT)

  logger.info(`Confirm Pending Transaction: ${transactionHash}`, {
    transactionHash,
  })

  const { isTransactionConfirmed, onReceipt, shouldBump } =
    hooks[message.process]

  const { isConfirmed, transaction } = await isTransactionConfirmed({
    message,
    transactionHash,
  })
  if (!transaction) {
    return
  }

  if (isConfirmed) {
    try {
      await onReceipt({ message, receipt: transaction })
      return
    } catch (error) {
      logger.error(
        `confirmPendingTransaction - failed to get receipt for transaction - retrying ${transactionHash}`,
        { transactionHash },
        error,
      )
    }
  } else {
    const { shouldBump: shouldBumpTransaction, gasPrice } = await shouldBump({
      message,
      transaction,
    })

    // If the gas price is less than the latest gas price minus the threshold, bump the gas price
    if (shouldBumpTransaction) {
      const { tx } = message
      logger.info(
        `Confirm Pending Transaction - bumping transaction - ${transactionHash} - old gas price - ${transaction.gasPrice} - new gas price - ${gasPrice}`,
        { transactionHash },
      )

      await publishSendEthereumTransactionEvent(
        {
          ...message,
          transactionHash,
          tx: {
            ...tx,
            gasPrice,
            nonce: transaction.nonce,
          },
        },
        { priority: BUMP_PRIORITY },
      )
      return
    }
  }

  await publishConfirmEthereumTransactionEvent({ message, transactionHash })
}
