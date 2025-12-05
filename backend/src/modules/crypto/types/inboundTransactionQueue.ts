import * as t from 'io-ts'

import { CryptoNetworkV } from './enums'

const InboundTransactionQueueMessageV = t.intersection([
  t.type({
    // these can either be transaction IDs or block IDs (block height)
    hashes: t.array(t.string),
    network: CryptoNetworkV,
  }),
  t.partial({
    attempts: t.number,
  }),
])

export type InboundTransactionQueueMessage = t.TypeOf<
  typeof InboundTransactionQueueMessageV
>

interface FilteredTransactionResponse<T, U> {
  filteredTransactions: Array<{
    transaction: T
    deposit: U
  }>
}

export interface InboundTransactionQueueHook<T, U> {
  fetchTransactionData: (
    message: InboundTransactionQueueMessage,
  ) => Promise<{ transactions: T[] }>
  filterTransactions: (
    transactions: T[],
  ) => Promise<FilteredTransactionResponse<T, U>>
  onBlockCompletion: (message: InboundTransactionQueueMessage) => Promise<void>

  onError: ({
    message,
    error,
  }: {
    message: InboundTransactionQueueMessage
    error: Error
  }) => Promise<void>
}
