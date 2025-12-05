import { publishDepositMessage } from 'src/modules/deposit/rabbitmq/publish'

import {
  type CryptoTransaction,
  type CryptoDepositPayload,
  type InboundTransactionQueueHook,
  type InboundTransactionQueueMessage,
} from '../../types'

export const handler =
  <T extends CryptoTransaction, U extends CryptoDepositPayload>(
    hooks: InboundTransactionQueueHook<T, U>,
  ) =>
  async (message: InboundTransactionQueueMessage) => {
    const { network } = message

    const {
      fetchTransactionData,
      filterTransactions,
      onBlockCompletion,
      onError,
    } = hooks

    try {
      const { transactions: transactionsWithMetadata } =
        await fetchTransactionData(message)

      const { filteredTransactions: deposits } = await filterTransactions(
        transactionsWithMetadata,
      )

      if (deposits.length) {
        await publishDepositMessage({
          network,
          deposits,
        })
      }

      await onBlockCompletion(message)
    } catch (error) {
      await onError({ message, error })
    }
  }
