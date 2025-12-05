import Web3 from 'web3'
import type Web3Type from 'web3'

import { config, MongoErrorCodes } from 'src/system'
import { runWorker } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'
import { cryptoLogger } from '../../lib/logger'

import {
  createEthereumBlock,
  getLastEthereumBlock,
} from 'src/modules/crypto/ethereum/documents/ethereum_blocks'

const DEPOSIT_SLEEP_SECONDS = config.ethereum.deposit.depositSleepSeconds
const WORKER = 'ethereumShallowCopy'

export async function run() {
  runWorker(WORKER, start)
}

async function start(): Promise<void> {
  const provider = new Web3.providers.HttpProvider(
    config.ethereum.httpProvider,
    { timeout: 30e3 },
  )
  const web3 = new Web3(provider)
  web3.eth.transactionPollingTimeout = 5000
  web3.eth.transactionConfirmationBlocks = 1

  await findBlocks(web3)

  provider.disconnect()

  await sleep(1000 * DEPOSIT_SLEEP_SECONDS)
  await start()
}

/**
 * See if a block exists and add it to our shallow copy of Ethereum if it does.
 */
async function addBlock(web3: Web3Type, blockNumber: number): Promise<boolean> {
  const logger = cryptoLogger('ethereum/worker/addBlock', { userId: null })
  // check if we've finished processing all available blocks
  const currentBlock = await web3.eth.getBlock(blockNumber, true)

  if (!currentBlock || !currentBlock.number) {
    logger.info(`${WORKER} - Block ${blockNumber} does not exist yet`, {
      blockNumber,
    })
    return true
  }

  try {
    await createEthereumBlock(currentBlock.number, currentBlock.hash)
  } catch (error) {
    if (error.code !== MongoErrorCodes.DUPLICATE_KEY) {
      logger.error(
        `Failed to create eth block - ${error.message}`,
        { blockNumber, currentBlock },
        error,
      )
    }
  }
  return false
}

/**
 * Look for Ethereum blocks until we get to the head of the chain.
 */
async function findBlocks(web3: Web3Type) {
  const logger = cryptoLogger('ethereum/worker/findBlocks', { userId: null })
  try {
    const headBlock = await getLastEthereumBlock()
    const headBlockNumber = headBlock?.height
      ? headBlock.height
      : await web3.eth.getBlockNumber()

    if (!headBlockNumber) {
      logger.error(`${WORKER} - no block number to start from`)
      return
    }

    logger.info(`${WORKER} - beginning blocks at ${headBlockNumber}`, {
      headBlockNumber,
      headBlock,
    })

    let currentBlockNumber = headBlockNumber
    let done = false

    do {
      done = await addBlock(web3, currentBlockNumber)
      currentBlockNumber++
    } while (!done)
  } catch (error) {
    logger.error(`${WORKER} findBlocks error - ${error.message}`, error)
  }
}
