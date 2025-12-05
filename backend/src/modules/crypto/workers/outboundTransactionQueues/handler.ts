import {
  type OutboundTransactionQueueHook,
  type CryptoOutboundTransactionQueueMessage,
  type CryptoNetwork,
  type Process,
  isConfirmationMessage,
} from 'src/modules/crypto/types'

import { RippleOutboundTransactionHooks } from '../../ripple/hooks'
import { TronOutboundTransactionHooks } from '../../tron/hooks'
import { cryptoLogger } from '../../lib/logger'

const attemptLimit = 100

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
  message: CryptoOutboundTransactionQueueMessage,
) => {
  const logger = cryptoLogger('workers/outboundTransactionQueues', {
    userId: null,
  })
  const { attempts = 0, network, process } = message

  logger.info(`Transactions Queue - recieved message: ${message}`, { message })

  const hooks = fetchHooks(network, process)
  if (!hooks) {
    return
  }

  const {
    validationCheck,
    beforeEach,
    sendTransaction,
    onSend,
    isPublishedTransaction,
    publishOutboundMessage,
    publishConfirmMessage,
    onError,
  } = hooks

  if (isConfirmationMessage(message)) {
    const isPublished = await isPublishedTransaction({ message })
    if (isPublished) {
      await publishConfirmMessage(message)
      return
    }
  }

  try {
    const isValid = validationCheck({ message })
    if (!isValid) {
      throw {
        message,
        error: {
          message: 'Validation failed',
        },
      }
    }

    const { shouldSend, message: newMessage } = await beforeEach({ message })

    if (!shouldSend) {
      logger.info(`Transactions Queue - skipping: ${newMessage}`, {
        newMessage,
      })
      return
    }

    const { transactionHash, blockSent } = await sendTransaction({
      message: newMessage,
      transaction: newMessage.tx,
    })

    await onSend({ message: newMessage, transactionHash, blockSent })

    await publishOutboundMessage({ ...newMessage, transactionHash })
  } catch (error) {
    const { shouldRetry } = await onError(error)
    if (shouldRetry && attempts < attemptLimit) {
      await publishOutboundMessage({
        ...message,
        attempts: attempts + 1,
      })
    }
  }
}
