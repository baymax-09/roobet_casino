import Web3 from 'web3'
import type Web3Type from 'web3'

import { config } from 'src/system'
import { runWorker } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'

import {
  markBlockAsProcessed,
  getEthereumBlock,
  getOldestUnProcessedBlock,
} from 'src/modules/crypto/ethereum/documents/ethereum_blocks'
import {
  batchConfirmationUpdate,
  processEthereumTransactions,
} from 'src/modules/crypto/ethereum/lib/transaction'
import { cryptoLogger } from '../../lib/logger'

const DEPOSIT_SLEEP_SECONDS = config.ethereum.deposit.depositSleepSeconds

export async function run() {
  runWorker('ethereumDeposits', start)
}

async function start(): Promise<void> {
  const provider = new Web3.providers.HttpProvider(
    config.ethereum.httpProvider,
    { timeout: 30e3 },
  )
  const web3 = new Web3(provider)
  web3.eth.transactionPollingTimeout = 5000
  web3.eth.transactionConfirmationBlocks = 1

  await processBlocks(web3)

  provider.disconnect()

  await sleep(1000 * DEPOSIT_SLEEP_SECONDS)
  await start()
}

/**
 * Process the non-smart contract transactions on an Ethereum block.
 */
async function processBlock(
  web3: Web3Type,
  blockNumber: number,
): Promise<boolean> {
  const logger = cryptoLogger('ethereum/processBlock', { userId: null })
  // check if we've finished processing all available blocks
  const currentBlock = await web3.eth.getBlock(blockNumber, true)
  const latestBlockNumber = await web3.eth.getBlockNumber()

  if (!currentBlock || !currentBlock.number) {
    logger.info(`Block ${blockNumber} does not exist yet`, { blockNumber })
    return true
  }

  const blockFromDatabase = await getEthereumBlock(blockNumber)

  // If we've already processed this block, then skip it
  if (blockFromDatabase && blockFromDatabase.processed) {
    logger.info(`${config.worker} - Block ${blockNumber} already processed`, {
      blockNumber,
      currentBlock,
    })
    return false
  }

  logger.info(`${config.worker} - processing block ${blockNumber}`, {
    blockNumber,
    currentBlock,
  })

  try {
    await batchConfirmationUpdate(web3, latestBlockNumber)
  } catch (error) {
    logger.error(
      `${config.worker} error updating confirmations for block: ${blockNumber} - ${error.message}`,
      { blockNumber, currentBlock },
      error,
    )
  }

  // Initiate main transaction process
  try {
    await processEthereumTransactions(
      currentBlock.transactions,
      latestBlockNumber,
    )
  } catch (error) {
    logger.error(
      `${config.worker} error processing ${currentBlock.transactions.length} transactions for block: ${blockNumber} - ${error.message}`,
      { blockNumber, currentBlock },
      error,
    )
  }

  await markBlockAsProcessed(blockNumber)

  return false
}

/**
 * Process the oldest, unprocessed Ethereum blocks one at a time until there are none left
 */
async function processBlocks(web3: Web3Type) {
  try {
    let unprocessedBlock = await getOldestUnProcessedBlock()
    while (unprocessedBlock) {
      await processBlock(web3, unprocessedBlock.height)
      unprocessedBlock = await getOldestUnProcessedBlock()
    }
  } catch (error) {
    cryptoLogger('ethereum/processBlocks', { userId: null }).error(
      `${config.worker} failed to process blocks - ${error.message}`,
      error,
    )
  }
}
