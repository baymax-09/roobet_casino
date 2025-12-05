import Web3 from 'web3'

import { config } from 'src/system'
import { runWorker } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'

import {
  type EthereumBlock,
  markBlockAsProcessedInternal,
  getInternalUnprocessedBlocks,
} from 'src/modules/crypto/ethereum/documents/ethereum_blocks'
// import { processInternalEthereumTransactions } from 'src/modules/crypto/ethereum/lib/transaction'
import { processEtherscanTransactions } from 'src/modules/crypto/ethereum/lib/transaction'

import { getInternalTransactionsForBlock } from '../lib/etherscan'
import { cryptoLogger } from '../../lib/logger'

const DEPOSIT_SLEEP_SECONDS = config.ethereum.deposit.depositSleepSeconds

export async function run() {
  if (config.isProd || config.isStaging) {
    runWorker('ethereumSmartContracts', start)
  }
}

async function start(): Promise<void> {
  const provider = new Web3.providers.HttpProvider(
    config.ethereum.httpProvider,
    { timeout: 30e3 },
  )
  const web3 = new Web3(provider)
  web3.eth.transactionPollingTimeout = 5000
  web3.eth.transactionConfirmationBlocks = 1

  // TODO fetch one at a time like ethereumDeposits
  const blocksToProcess = await getInternalUnprocessedBlocks()
  cryptoLogger('ethereum/workers/start', { userId: null }).info(
    `${config.worker} - blocksToProcess: ${blocksToProcess.length}`,
    { worker: config.worker },
  )
  const latestBlockNumber = await web3.eth.getBlockNumber()
  for (const block of blocksToProcess) {
    await processBlock(block, latestBlockNumber)
  }

  await sleep(1000 * DEPOSIT_SLEEP_SECONDS)
  await start()
}

async function processBlock(block: EthereumBlock, latestBlockNumber: number) {
  const logger = cryptoLogger('ethereum/workers/processBlock', { userId: null })
  try {
    const blockNumber = block.height

    if (block && block.processedInternal) {
      logger.info(`${config.worker} - Block ${blockNumber} already processed`, {
        worker: config.worker,
        blockNumber,
      })
      return
    }

    logger.info(`${config.worker} - getting block: ${blockNumber}`, {
      worker: config.worker,
      blockNumber,
    })
    // const currentBlock = await web3.eth.getBlock(blockNumber, true)
    const internalTransactions =
      await getInternalTransactionsForBlock(blockNumber)

    /*
     * try {
     *   await processInternalEthereumTransactions(web3, currentBlock.transactions)
     * } catch (error) {
     *   winston.error('ProcessBlock - Error processing internal transactions for block - ', blockNumber, error)
     * }
     */
    await processEtherscanTransactions(internalTransactions, latestBlockNumber)
    await markBlockAsProcessedInternal(blockNumber)
  } catch (error) {
    logger.error(
      `${config.worker} error - ${error.message}`,
      { worker: config.worker },
      error,
    )
  }
}
