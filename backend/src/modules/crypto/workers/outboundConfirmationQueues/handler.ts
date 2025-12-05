import { scopedLogger } from 'src/system/logger'
import {
  type OutboundTransactionQueueHook,
  type CryptoOutboundConfirmationQueueMessage,
  type Process,
  type CryptoOutboundTransactionQueueMessage,
  type CryptoNetwork,
  OutboundQueuePriority,
} from 'src/modules/crypto/types'
import { TronOutboundTransactionHooks } from '../../tron/hooks'
import { RippleOutboundTransactionHooks } from '../../ripple/hooks'

const { BUMP_PRIORITY } = OutboundQueuePriority
const confirmationLogger = scopedLogger('crypto-outboundTransactionQueue')

const fetchHooks = (
  network: CryptoNetwork,
  process: Process,
):
  | OutboundTransactionQueueHook<
      CryptoOutboundTransactionQueueMessage,
      unknown,
      unknown
    >
  | undefined => {
  if (
    network === 'Tron' &&
    (process === 'withdrawal' || process === 'pooling')
  ) {
    return TronOutboundTransactionHooks[process]
  }

  // there is no pooling for ripple
  if (network === 'Ripple') {
    return RippleOutboundTransactionHooks.withdrawal
  }
}

export const handler = async (
  message: CryptoOutboundConfirmationQueueMessage,
): Promise<void> => {
  const logger = confirmationLogger('confirmation-queue', { userId: null })
  const { process, network, transactionHash } = message

  const hooks = fetchHooks(network, process)
  if (!hooks) {
    return
  }

  const {
    isTransactionConfirmed,
    onReceipt,
    bumpCheck,
    publishOutboundMessage,
    publishConfirmMessage,
  } = hooks

  try {
    const { isConfirmed, transaction } = await isTransactionConfirmed({
      message,
      transactionHash,
    })

    logger.info('start confirming transaction', { transaction })

    if (!transaction) {
      const errorMessage = 'transaction does not exist anymore'
      logger.error(errorMessage, { transactionHash, transaction })
      return
    }
    if (isConfirmed) {
      try {
        await onReceipt({ message, receipt: transaction })
        return
      } catch (error) {
        logger.error(
          'failed to get receipt for transaction - retrying...',
          { transactionHash, transaction },
          error,
        )
      }
    }
  } catch (error) {
    logger.error(
      'failed to get any info for transaction - retrying...',
      { transactionHash },
      error,
    )
  }

  try {
    const result = await bumpCheck({ message, transactionHash })

    if (result && result.shouldBump) {
      await publishOutboundMessage(result.message, {
        priority: BUMP_PRIORITY,
      })
      return
    }

    await publishConfirmMessage(message)
  } catch (error) {
    logger.error(
      'failed to bump check and publish message - retrying...',
      { transactionHash },
      error,
    )
  }
}
