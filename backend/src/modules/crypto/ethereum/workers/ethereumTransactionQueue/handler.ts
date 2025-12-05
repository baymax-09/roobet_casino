import HDWalletProvider from '@truffle/hdwallet-provider'
import Web3 from 'web3'

import { sleep } from 'src/util/helpers/timer'

import { cryptoLogger } from 'src/modules/crypto/lib/logger'
import { hooks } from '../../hooks'
import { type TransactionsQueueMessage } from '../../types'
import { getWalletOptions, sendTransaction } from '../../util'
import { publishConfirmEthereumTransactionEvent } from '../../rabbitmq'

/**
 * All outbound transactions are sent through this queue. When a transaction is sent, its hash is
 * sent to the confirmations queue to be checked for confirmation and possibly re-broadcast with
 * a higher gas price.
 * @param messages | TransactionsQueueMessage[]
 * @returns void
 */
const handler = async (message: TransactionsQueueMessage) => {
  const { process, signer } = message
  const logger = cryptoLogger('ethereum/ethereumTransactionQueue/handler', {
    userId: null,
  })

  logger.info(`Transactions Queue - recieved message: ${message}`, { message })

  const { beforeEach, onSend, onError } = hooks[process]

  const walletOptions = getWalletOptions(signer)
  const provider = new HDWalletProvider({ ...walletOptions, shareNonce: false })
  const web3 = new Web3(provider)

  // Before sending the transaction, check if it has already been confirmed
  if (message.transactionHash) {
    // This transaction message is coming from the confirmations queue
    try {
      const tx = await web3.eth.getTransaction(message.transactionHash)

      if (tx?.blockNumber) {
        // This message has already been confirmed
        // Send back to confirmations queue for clean up
        await publishConfirmEthereumTransactionEvent({
          message,
          transactionHash: message.transactionHash,
        })
        provider.engine.stop()
        return
      }
    } catch (error) {
      logger.error(
        `Transactions Queue error - ${error.message}`,
        { message },
        error,
      )
    }
  }

  try {
    const { shouldSend, message: newMessage } = await beforeEach({ message })

    if (!shouldSend) {
      logger.info(`Transactions Queue - skipping: ${newMessage}`, {
        message: newMessage,
      })
      return
    }

    // Temp fix to slow down our sends, we seem to be sending messages to QuickNode too quickly
    await sleep(2000)

    logger.info(`Transactions Queue - sending: ${newMessage}`, {
      message: newMessage,
    })

    const blockSent = await web3.eth.getBlockNumber()
    const transactionHash = await sendTransaction(provider, newMessage.tx)

    await onSend({ message: newMessage, transactionHash, blockSent })

    await publishConfirmEthereumTransactionEvent({
      message: newMessage,
      transactionHash,
    })
  } catch (error) {
    await onError({ message, error })
  } finally {
    provider.engine.stop()
  }
}

export default handler
