import { Client, type Client as IClient } from 'xrpl'

import { config, MongoErrorCodes } from 'src/system'
import { scopedLogger } from 'src/system/logger'
import { runWorker } from 'src/util/workerRunner'
import { sleep } from 'src/util/helpers/timer'
import { exists } from 'src/util/helpers/types'

import { createLedger, getLastLedger } from '../documents/ripple_ledgers'
import { derivePrimaryWallet, getAccountTx, getLedgerFromIndex } from '../lib'
import { publishRippleInboundTransactionMessage } from '../rabbitmq'

const xrpLogger = scopedLogger('xrpShallowCopy')
const DEPOSIT_SLEEP_SECONDS = config.ripple.deposit.sleepSeconds
const WORKER = 'xrpShallowCopy'

export function run() {
  const logger = xrpLogger('run', { userId: null })
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
  const logger = xrpLogger('start', { userId: null })
  let client
  try {
    // Instantiate a new xrp client
    client = new Client(config.ripple.wsProvider)
  } catch (error) {
    logger.error(`${WORKER} - failed to instantiate new xrp client`, {}, error)

    // Sleep for the specified amount of time, then try again
    await sleepAndRestartWorker()
    return
  }

  // Process transactions from the client until an error occurs
  await processTransactionsUntilFailure(client)

  // Sleep for the specified amount of time, then try again
  await sleepAndRestartWorker()
}

interface ProcessTransactionsResult {
  success: boolean
  message: string
  error?: Error
}

/**
 * Continuously processes transactions from a Ripple client until a failure occurs.
 *
 * This function attempts to connect to the client, retrieve ledgers and transactions,
 * and then disconnect from the client. If any of these operations fail, it logs an error
 * and then continues with the next iteration of the loop. Between each iteration, it
 * sleeps for a specified amount of time.
 *
 * @param {Client} client - The Ripple client to process transactions from.
 * @returns {Promise<void>} A Promise that resolves when the function has finished.
 */
async function processTransactionsUntilFailure(client: Client): Promise<void> {
  const logger = xrpLogger('processTransactionsUntilFailure', { userId: null })

  // Consider the connection to be healthy unless an error occurs on disconnect.
  let connectionIsHealthy = true

  // Continuously process transactions from the client
  while (connectionIsHealthy) {
    try {
      // Process transactions from the client. If any errors occur, log them.
      const { success, message, error } = await processTransactions(client)
      if (!success) {
        logger.error(message, {}, error)
      }
    } catch (err) {
      // This should never happen, but if it does, log it.
      logger.error(`${WORKER} - error processing transactions`, {}, err)
    } finally {
      // After each iteration, disconnect the client and sleep for the specified amount of time.
      try {
        // Attempt to disconnect the client. If this fails, log it and restart the worker.
        await client.disconnect()

        // Sleep for the specified amount of time before reconnecting to the client
        // and processing additional transactions
        await sleep(1000 * DEPOSIT_SLEEP_SECONDS)
      } catch (error) {
        logger.error(`${WORKER} - failed to disconnect from client`, {}, error)

        // Break out of the loop. If we failed to disconnect the client,
        // we probably won't be able to connect to it again.
        // If this happens, we should probably restart the worker.
        connectionIsHealthy = false

        // I would return directly here, but it's not allowed in a finally block.
      }
    }
  }
}

/**
 * Processes transactions from a Ripple client.
 *
 * This function attempts to connect to the client and retrieve ledgers and transactions.
 * If any of these operations fail, it returns an object with `success` set to `false`,
 * a message describing the error, and the error itself.
 * If all operations succeed, it returns an object with `success` set to `true` and a success message.
 *
 * @param {Client} client - The Ripple client to process transactions from.
 * @returns {Promise<ProcessTransactionsResult>} An object describing the result of the operation.
 * The object has a `success` property that indicates whether the operation was successful,
 * a `message` property that contains a description of the operation,
 * and an `error` property that contains any error that occurred during the operation.
 */
async function processTransactions(
  client: Client,
): Promise<ProcessTransactionsResult> {
  try {
    // Attempt to connect to the client
    await client.connect()
  } catch (error) {
    return {
      success: false,
      message: `${WORKER} - failed to connect to client`,
      error,
    }
  }

  try {
    // Attempt to retrieve ledgers and transactions
    await retrieveLedgersAndTxs(client)
  } catch (error) {
    return {
      success: false,
      message: `${WORKER} - failed to retrieve ledgers and transactions`,
      error,
    }
  }

  return {
    success: true,
    message: `${WORKER} - successfully retrieved ledgers and transactions`,
  }
}

async function addLedger(client: IClient, ledgerIndex: number) {
  const logger = xrpLogger('addLedger', { userId: null })
  const currentLedger = await getLedgerFromIndex(client, ledgerIndex)

  if (!currentLedger || !currentLedger?.result.ledger_index) {
    logger.info(`${WORKER} - ripple ledger ${ledgerIndex} does not exist yet`, {
      ledgerIndex,
    })
    return
  }

  const { ledger_index, ledger_hash } = currentLedger.result

  try {
    await createLedger(ledger_index, ledger_hash)
  } catch (error) {
    if (error.code !== MongoErrorCodes.DUPLICATE_KEY) {
      logger.error(`${WORKER} - failed to create ripple ledger`, {}, error)
    }
  }
}

async function retrieveLedgersAndTxs(client: IClient) {
  const logger = xrpLogger('retrieveLedgersAndTxs', { userId: null })
  const primaryWalletAddr: string = derivePrimaryWallet().classicAddress
  let ledger_min = (await getLastLedger())?.ledgerIndex
  const ledger_max = await client.getLedgerIndex()

  if (!ledger_max) {
    logger.error(`${WORKER} failed to retrieve ledger_max`)
    throw new Error('Failed to retrieve ledger_max')
  }
  if (!ledger_min) ledger_min = ledger_max

  await addLedger(client, ledger_max)

  logger.info(
    `${WORKER} - unprocessed ledger index ${ledger_min}, current ledger index ${ledger_max}`,
    { ledger_min, ledger_max },
  )

  const transaction = await getAccountTx(
    client,
    primaryWalletAddr,
    ledger_min,
    ledger_max,
  )
  const txHashesForInboundQueue = transaction.result.transactions
    .map(item => item.tx?.hash)
    .filter(exists)
  // placeholder for inbound transaction queue
  logger.info(
    `${WORKER} - inbound transaction hashes between ${ledger_min} and ${ledger_max} - ${txHashesForInboundQueue}`,
    { ledger_min, ledger_max, txHashesForInboundQueue },
  )
  if (txHashesForInboundQueue.length) {
    await publishRippleInboundTransactionMessage({
      hashes: txHashesForInboundQueue,
      network: 'Ripple',
    })
  }
}
