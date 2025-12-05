import type TronWeb from 'tronweb'

import { scopedLogger } from 'src/system/logger'
import { MongoErrorCodes, config } from 'src/system'
import { runWorker } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'
import { BlockInfoV } from 'src/types/tronweb/controls'

import { createTronBlock, getLastBlock } from '../documents/tron_blocks'
import { publishTronInboundTransactionMessage } from '../rabbitmq'
import { getLatestConfirmedBlock } from '../lib/deposit'
import { getProvider } from '../util/getProvider'

const trxLogger = scopedLogger('trxShallowCopy')
const WORKER = 'tronShallowCopy'
const { sleepSeconds: DEPOSIT_SLEEP_SECONDS } = config.tron.deposit

export function run() {
  const logger = trxLogger('run', { userId: null })
  runWorker(WORKER, start).catch(error => {
    logger.error(`${WORKER} - error`, {}, error)
  })
}

async function sleepAndRestartWorker(): Promise<void> {
  // Sleep for the specified amount of time, then try again
  await sleep(1000 * DEPOSIT_SLEEP_SECONDS)
  await start()
}

async function start(): Promise<void> {
  const tronWeb = getProvider()
  await findBlocks(tronWeb)

  await sleepAndRestartWorker()
}

/**
 * See if a block exists and add it to our shallow copy of TRON if it does.
 */
async function addBlock(
  tronWeb: TronWeb,
  currentBlockNumber: number,
  targetBlockNumber: number,
): Promise<boolean> {
  const logger = trxLogger('addBlock', { userId: null })

  if (currentBlockNumber > targetBlockNumber) {
    return true
  }

  const latestConfirmedBlock =
    await tronWeb.trx.getBlockByNumber(currentBlockNumber)

  if (
    !latestConfirmedBlock ||
    !latestConfirmedBlock.block_header.raw_data.number
  ) {
    logger.error('Block does not exist yet', {})
    return true
  }

  if (!BlockInfoV.is(latestConfirmedBlock)) {
    logger.error('Block type does not match what we expect', {
      latestConfirmedBlock,
    })
    return true
  }

  const blockHeightToInsert = latestConfirmedBlock.block_header.raw_data.number

  try {
    await createTronBlock(blockHeightToInsert, latestConfirmedBlock.blockID)
    await publishTronInboundTransactionMessage({
      hashes: [blockHeightToInsert.toString()],
      network: 'Tron',
    })
  } catch (error) {
    if (error.code !== MongoErrorCodes.DUPLICATE_KEY) {
      // if this block record already exists, then we need to wait for more confirmed blocks
      logger.error('failed to create eth block', {}, error)
    }
  }
  return false
}

/**
 * Look for TRON blocks until we get to the last confirmed block on the chain
 */
async function findBlocks(tronWeb: TronWeb) {
  const logger = trxLogger('findBlocks', { userId: null })
  try {
    const lastConfirmedBlockOnChain = await getLatestConfirmedBlock()
    if (!lastConfirmedBlockOnChain.success) {
      logger.error(
        `could not fetch latest confirmed block`,
        {},
        lastConfirmedBlockOnChain.error,
      )
      return
    }

    const lastConfirmedBlockHeightOnChain =
      lastConfirmedBlockOnChain.result.block_header.raw_data.number
    if (!lastConfirmedBlockHeightOnChain) {
      logger.error(`no confirmed block target height`)
      return
    }

    const lastBlockInDB = await getLastBlock()
    // if we have a block record, then set this to the next block we DO NOT have in the DB
    const lastConfirmedBlockHeight = lastBlockInDB
      ? lastBlockInDB.height + 1
      : lastConfirmedBlockHeightOnChain

    logger.info(`${WORKER} - beginning blocks at ${lastConfirmedBlockHeight}`)

    let currentBlockNumber = lastConfirmedBlockHeight
    let done = false

    do {
      done = await addBlock(
        tronWeb,
        currentBlockNumber,
        lastConfirmedBlockHeightOnChain,
      )
      currentBlockNumber++
    } while (!done)
  } catch (error) {
    logger.error(`${WORKER} - unknown error caught`, error)
  }
}
