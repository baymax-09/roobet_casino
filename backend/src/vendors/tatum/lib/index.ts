import { NetworkMap, type ValidTatumNetwork } from '../types/network'
import { getCurrentFeeEstimate } from './fee'
import {
  subscribeToAddressEvents,
  unsubscribeFromAddressEvents,
} from './subscription'
import { getTransactionById, sendTransaction } from './transaction'

interface TransactionPayload {
  fromAddress: Array<{ address: string }>
  /** value is always denominated in the native token */
  to: Array<{ address: string; value: number }>
  /** stringified version of the fee we are willing to pay, denominated in the native token */
  fee: string
  /** address to send any leftover change */
  changeAddress: string
}

export const getTatumInterface = (network: ValidTatumNetwork) => {
  const tatumNetwork = NetworkMap[network]

  return {
    balance: {},
    fee: {
      estimateFee: async () => await getCurrentFeeEstimate(tatumNetwork),
    },
    notifications: {
      subscribeToAddress: async (address: string) =>
        await subscribeToAddressEvents(tatumNetwork, address),
      unsubscribeFromAddress: async (subscriptionId: string) => {
        await unsubscribeFromAddressEvents(tatumNetwork, subscriptionId)
      },
    },
    transactions: {
      getTransaction: async (transactionId: string) =>
        await getTransactionById(network, transactionId),
      sendTransaction: async (transactionPayload: TransactionPayload) =>
        await sendTransaction(tatumNetwork, transactionPayload),
    },
  }
}
