import { config } from 'src/system'
import { runWorker } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'
import { BlockIOApiMap } from 'src/vendors/blockio/lib'

import {
  getOldPendingTransactions,
  updateOutgoingTransaction,
} from '../documents/outgoing_transactions'
import { isBlockioCryptoProperName } from '../types'
import { getBlockByBlockHash } from '../lib'
import { cryptoLogger } from '../lib/logger'

const PENDING_HOURS_OLD = 1
const DOCUMENT_LIMIT = 350

export async function run() {
  if (config.isProd || config.isStaging) {
    runWorker('pendingOutgoingTransactions', start)
  }
}

async function start(): Promise<void> {
  while (true) {
    await processPendingOutgoingTransactions()
    await sleep(1000 * 60 * 60 * 1) // 1 hour
  }
}

async function processPendingOutgoingTransactions() {
  const logger = cryptoLogger('workers/processPendingOutgoingTransactions', {
    userId: null,
  })
  const pendingTransactions = await getOldPendingTransactions({
    networks: ['Bitcoin', 'Litecoin', 'Dogecoin'],
    hours: PENDING_HOURS_OLD,
    limit: DOCUMENT_LIMIT,
  })

  for (const transaction of pendingTransactions) {
    const { network, transactionHash } = transaction

    // To make TS happy
    if (!isBlockioCryptoProperName(network)) {
      continue
    }

    logger.info(`Processing outgoing transaction txHash: ${transactionHash}`, {
      transactionHash,
      network,
    })

    const blockIOApi = BlockIOApiMap[network]

    try {
      const transactionResponse =
        await blockIOApi.getTransaction(transactionHash)

      const { blockhash } = transactionResponse

      // If the transaction has not been confirmed after 24 hours of being created, then consider is reverted
      const twelveHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      if (transaction.createdAt < twelveHoursAgo && !blockhash) {
        await updateOutgoingTransaction(network, transactionHash, {
          status: 'reverted',
        })
        continue
      }

      // If the transaction has a blockhash, then we know it has been completed
      if (blockhash) {
        const block = await getBlockByBlockHash(network, blockhash)
        const blockConfirmed = block.height
        await updateOutgoingTransaction(network, transactionHash, {
          status: 'completed',
          blockConfirmed,
          blockHash: blockhash,
        })
      }
    } catch (error) {
      logger.error(
        `processPendingOutgoingTransaction worker error for: ${transactionHash} - ${error.message}`,
        { transactionHash },
        error,
      )
    } finally {
      await sleep(1000 * 2)
    }
  }
}
