import type HDWalletProvider from '@truffle/hdwallet-provider'
import { type TransactionConfig } from 'web3-core'
import { toHex } from 'web3-utils'

import { cryptoLogger } from '../../lib/logger'

/**
 * Send a transaction and return the transaction hash
 * @param provider | instance of HDWalletProvider
 * @param tx | TransactionConfig
 * @returns | transaction hash
 */
export async function sendTransaction(
  provider: HDWalletProvider,
  transaction: TransactionConfig,
) {
  const logger = cryptoLogger('ethereum/sendTransaction', { userId: null })
  logger.info(`sendTransaction - ${transaction}`, { transaction })

  return await new Promise<string>((resolve, reject) => {
    try {
      provider.send(
        {
          jsonrpc: '2.0',
          method: 'eth_sendTransaction',
          params: [
            {
              ...transaction,
              ...(transaction.value && { value: toHex(transaction.value) }),
              gasPrice: toHex(transaction.gasPrice!),
              gas: toHex(transaction.gas!),
            },
          ],
          id: new Date().getTime(),
        },
        (error, response) => {
          if (error || !response.result) {
            logger.error(
              `Web3.eth.sendTransaction uncaught exception in Promise - ${error?.message}`,
              { error, transaction },
            )
            reject(error)
          } else {
            resolve(response.result)
          }
        },
      )
    } catch (error) {
      logger.error(
        `Web3.eth.sendTransaction uncaught exception - ${error.message}`,
        { transaction },
        error,
      )
      throw error
    }
  })
}
