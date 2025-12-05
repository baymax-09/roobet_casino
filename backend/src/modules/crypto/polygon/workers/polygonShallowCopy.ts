import { MongoErrorCodes } from 'src/system'
import { runWorker } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'

import { createPolygonBlock, getLatestBlock } from '../documents/polygon_blocks'
import { getBlock, getLatestBlockNumber } from '../lib/api'
import { polygonLogger } from '../lib/logger'

const WORKER = 'polygonShallowCopy'

export function run() {
  const logger = polygonLogger('run', { userId: null })
  runWorker(WORKER, start).catch(error => {
    logger.error(`${WORKER} - Failed to run`, {}, error)
  })
}

async function start(): Promise<void> {
  const logger = polygonLogger('start', { userId: null })
  try {
    await findBlocks()
  } catch (error) {
    logger.error(`${WORKER} - Failed to find blocks`, {}, error)
  } finally {
    await sleep(1000 * 2)
  }
  await start()
}

/**
 * See if a block exists and add it to our shallow copy of Polygon if it does.
 */
async function addBlock(blockNumber: number): Promise<boolean> {
  const logger = polygonLogger('addBlock', { userId: null })

  // check if we've finished processing all available blocks
  const currentBlock = await getBlock(blockNumber)

  if (!currentBlock || !currentBlock.blockHeight) {
    logger.info(`${WORKER} - Block ${blockNumber} does not exist yet`, {
      blockNumber,
    })
    return true
  }

  try {
    await createPolygonBlock(currentBlock.blockHeight, currentBlock.blockHash)
  } catch (error) {
    if (error.code !== MongoErrorCodes.DUPLICATE_KEY) {
      logger.error(
        `${WORKER} - Failed to create polygon block`,
        { blockNumber },
        error,
      )
    }
  }
  return false
}

/**
 * Look for Polygon blocks until we get to the head of the chain.
 */
async function findBlocks() {
  const logger = polygonLogger('findBlocks', { userId: null })
  const headBlock = await getLatestBlock()
  let headBlockNumber = headBlock?.height

  if (!headBlockNumber) {
    headBlockNumber = await getLatestBlockNumber()
  }

  logger.info(`${WORKER} - beginning blocks at ${headBlockNumber}`, {
    headBlockNumber,
  })

  let currentBlockNumber = headBlockNumber
  let done = false

  do {
    done = await addBlock(currentBlockNumber)
    currentBlockNumber++
  } while (!done)
}
