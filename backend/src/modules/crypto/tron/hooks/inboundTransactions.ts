import _ from 'underscore'

import { config } from 'src/system'
import { scopedLogger } from 'src/system/logger'

import { getBlockData } from '../lib/deposit'
import { type TronDeposit, type Transaction } from '../types'
import { DepositError, type InboundTransactionQueueHook } from '../../types'
import { getProvider } from '../util/getProvider'
import { markBlockAsProcessed } from '../documents/tron_blocks'
import { isFeatureAvailable } from 'src/util/features'
import { getTrxDeposit } from '../lib'
import { exists } from 'src/util/helpers/types'

interface FilterTransactionResult {
  deposit: TronDeposit
  transaction: Transaction
}

const tronLogger = scopedLogger('tron-inboundTransactionQueue-hooks')
const TRANSACTION_CHUNK_SIZE = config.tron.deposit.chunkSize

export const TronInboundTransactionHooks: InboundTransactionQueueHook<
  Transaction,
  TronDeposit
> = {
  fetchTransactionData: async message => {
    const logger = tronLogger('fetchTransactionData', { userId: null })

    const time = Date.now()

    // block height is in hex format
    const { hashes } = message
    const tronWeb = getProvider()

    // expecting 1 block height in this Array
    if (!hashes.length) {
      logger.error('no block heights in message')
      return {
        transactions: [],
      }
    }

    const blockHeight = hashes[0]
    const response = await getBlockData(tronWeb, blockHeight)
    if (!response.success) {
      logger.error('Could not fetch blocks', { blockHeight }, response.error)
      return {
        transactions: [],
      }
    }

    logger.info('fetchTransactionData', {
      time: Date.now() - time,
      transactionCount: response.result.transactions?.length ?? 0,
      blockHeight,
    })

    return {
      transactions: response.result.transactions ?? [],
    }
  },
  filterTransactions: async transactions => {
    const blockNumber = transactions[0].raw_data.ref_block_hash

    const filterTime = Date.now()

    const logger = tronLogger('filterTransactions', { userId: null })
    const tronWeb = getProvider()

    // TODO temporary feature flag check -- remove after TRC20 release
    const isTRC20FeatureAvailable = await isFeatureAvailable('tron:usdt')

    const logError = (error: DepositError, data: any) =>
      logger.error(
        'Some transactions unexpectedly failed to be filtered',
        data,
        error,
      )

    // chunk the transaction array for some concurrent processing
    const chunks = _.chunk(transactions, TRANSACTION_CHUNK_SIZE)
    const filteredTransactions: FilterTransactionResult[] = []

    for (const chunk of chunks) {
      const chunkTime = Date.now()

      const promises = chunk.map(async transaction => {
        try {
          return await getTrxDeposit(
            tronWeb,
            transaction,
            isTRC20FeatureAvailable,
          )
        } catch (error) {
          logError(new DepositError(error), transaction)
          return undefined
        }
      })

      const deposits = (await Promise.all(promises)).filter(exists)

      logger.info('chunk', {
        milliseconds: Date.now() - chunkTime,
        chunkSize: chunk.length,
        depositSize: deposits.length,
        transactionsSize: transactions.length,
        blockNumber,
      })

      filteredTransactions.push(...deposits)
    }

    logger.info('filterTransactions', {
      time: Date.now() - filterTime,
      originalTxCount: transactions.length,
      filteredTxCount: filteredTransactions.length,
      blockNumber,
    })

    return {
      filteredTransactions,
    }
  },
  onBlockCompletion: async message => {
    const { hashes } = message
    const logger = tronLogger('onBlockCompletion', { userId: null })

    // expecting 1 block height in this Array
    if (!hashes.length) {
      logger.error('no block heights in message')
      return
    }

    const blockHeight = parseInt(hashes[0])
    if (isNaN(blockHeight)) {
      return
    }

    await markBlockAsProcessed(blockHeight)
  },
  onError: async ({ message, error }) => {
    const logger = tronLogger('onError', { userId: null })
    logger.error('hooks unknown error', message, error)
  },
}
