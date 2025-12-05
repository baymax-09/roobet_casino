import Web3 from 'web3'
import type Web3Type from 'web3'
import { type Transaction, type HttpProvider } from 'web3-core'
import { type JsonRpcResponse } from 'web3-core-helpers'
import { toBN } from 'web3-utils'
import _ from 'underscore'
import { type Types } from 'mongoose'

import { config } from 'src/system'
import { getEthereumWalletByUserId } from 'src/modules/crypto/lib/wallet'
import {
  calculateConfirmations,
  confirmPendingDeposit,
} from 'src/modules/crypto/ethereum/lib/confirm'
import { addCryptoDeposit } from 'src/modules/crypto/lib'
import {
  getPendingTransactionsOfType,
  updateDepositTransaction,
} from 'src/modules/deposit/documents/deposit_transactions_mongo'
import { startDeposit } from 'src/modules/deposit'
import { getUserById } from 'src/modules/user'
import { isValidCryptoDepositType } from 'src/modules/deposit/types'
import { type EtherscanInternalTransaction } from 'src/modules/crypto/ethereum/lib/etherscan'

import { getErc20Deposits, getEthereumDeposits } from './deposits'
import { type EthereumDeposit } from '../types'
import { validateEthereumTransactionForDeposit } from './validate'
import { cryptoLogger } from '../../lib/logger'

interface JsonRpcResponseResult {
  type: string
  from: string
  to: string
  value: string
  gas: string
  gasUsed: string
  input: string | null
  output: string
  calls?: JsonRpcResponseResult[]
}

interface JsonRpcCallTraceResponse extends JsonRpcResponse {
  result?: JsonRpcResponseResult
}

const minConfirmations = config.ethereum.minConfirmations

const getInternalTransactionValue = (call: JsonRpcResponseResult) => {
  let value = call.value ? toBN(call.value) : toBN(0)

  if (call.type === 'CALL') {
    const subCalls = call.calls?.filter(subCall => subCall.to !== call.to) || []

    for (const subCall of subCalls) {
      value = value.add(getInternalTransactionValue(subCall))
    }
  }

  return value
}

const traceTransaction = async (
  provider: HttpProvider,
  transaction: Transaction,
): Promise<JsonRpcCallTraceResponse | undefined> =>
  await new Promise((resolve, reject) => {
    provider.send(
      {
        method: 'debug_traceTransaction',
        params: [transaction.hash, { tracer: 'callTracer' }],
        jsonrpc: '2.0',
        id: new Date().getTime(),
      },
      (err: any, response) => {
        if (err) {
          cryptoLogger('ethereum/traceTransaction', {
            userId: transaction.from,
          }).error(
            `Error when processing Ethereum internal transaction ${transaction.hash} - ${err.message}`,
            { transaction },
            err,
          )
          reject(err)
          return
        }
        resolve(response)
      },
    )
  })
/*
 * export async function processInternalEthereumTransactions(
 *   transactions: Transaction[],
 * ) {
 *   const provider = new Web3.providers.HttpProvider(
 *     config.ethereum.httpProvider,
 *     { timeout: 30e3 },
 *   )
 *
 *   for (const transaction of transactions) {
 *     try {
 *       const trace = await traceTransaction(provider, transaction)
 *
 *       if (!trace || !trace.result) {
 *         winston.error(
 *           `Error when processing Ethereum internal transaction ${transaction.hash} - no trace result`,
 *         )
 *         continue
 *       }
 *
 *       const jsonRpcCalls = trace.result?.calls?.filter(
 *         call => call.type === 'CALL' && call.from.startsWith('0x'),
 *      )
 *
 *       const internalTransactions =
 *         jsonRpcCalls?.map(call => {
 *           const value = getInternalTransactionValue(call).toString()
 *           return {
 *             from: call.from,
 *             to: call.to,
 *             value,
 *           }
 *         }) || []
 *
 *       for (const internalTransaction of internalTransactions) {
 *         if (toBN(internalTransaction.value).gt(toBN(0))) {
 *           const tx = {
 *             ...transaction,
 *             ...internalTransaction,
 *             internal: true,
 *           }
 *
 *           processEthereumTransaction(tx)
 *         }
 *       }
 *    } catch (error) {
 *       winston.error(
 *         `Error when processing Ethereum internal transaction ${transaction.hash}`,
 *         error,
 *       )
 *     }
 *   }
 *
 *   provider.disconnect()
 * }
 */

export async function processEtherscanTransactions(
  transactions: EtherscanInternalTransaction[],
  latestBlockNumber: number,
) {
  const chunks = _.chunk(transactions, config.ethereum.deposit.chunkSize)
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(
        async transaction =>
          await processEtherscanTransaction(transaction, latestBlockNumber),
      ),
    )
  }
}

export async function processEthereumTransactions(
  transactions: Transaction[],
  latestBlockNumber: number,
) {
  const chunks = _.chunk(transactions, config.ethereum.deposit.chunkSize)
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(
        async transaction =>
          await processEthereumTransaction(transaction, latestBlockNumber),
      ),
    )
  }
}

export type ProcessEthereumTransactionResult =
  | {
      success: false
      error: string
    }
  | {
      success: true
      internal: true
      depositId: Types.ObjectId
      userId: string
      forcedReprocess?: boolean
    }
  | {
      success: true
      internal: false
      depositId: Types.ObjectId
      credited: boolean
      confirmations: number
      userId: string
    }

export const processEthereumTransaction = async (
  transaction: Transaction,
  latestBlockNumber: number,
  forcedReprocess?: boolean,
): Promise<ProcessEthereumTransactionResult[]> => {
  const deposits: EthereumDeposit[] = []
  const results: ProcessEthereumTransactionResult[] = []

  const provider = new Web3.providers.HttpProvider(config.ethereum.httpProvider)
  const web3 = new Web3(provider)
  const receipt = await web3.eth.getTransactionReceipt(transaction.hash)

  const erc20Deposits = await getErc20Deposits(web3, transaction, receipt.logs)
  deposits.push(...erc20Deposits)
  const logger = cryptoLogger('ethereum/processEthereumTransaction', {
    userId: transaction.from,
  })

  const ethDeposits = await getEthereumDeposits(transaction)
  deposits.push(...ethDeposits)

  if (!deposits.length) {
    return results
  }

  provider.disconnect()

  for (const deposit of deposits) {
    const { user, wallet, depositAmountUSD, depositId, depositType, meta } =
      deposit

    try {
      const depositObjectId = await startDeposit({
        user,
        depositType,
        network: 'Ethereum',
        amount: depositAmountUSD,
        currency: 'usd',
        depositId,
        externalId: transaction.hash,
        meta,
        forcedReprocess,
      })

      if (!depositObjectId) {
        logger.error(
          `Ethereum Deposit - Could not create mongo deposit record for User ID: ${user.id} and Transaction ID: ${transaction.hash}`,
          { deposit, transaction, user },
        )
        continue
      }

      // Basic validation steps on the transaction
      const validationResponse = validateEthereumTransactionForDeposit(receipt)

      // Update the number of confirmations using the head block.
      const confirmations = calculateConfirmations(
        latestBlockNumber,
        transaction.blockNumber,
        0,
      )

      // Update the status of the deposit
      await updateDepositTransaction({
        _id: depositObjectId,
        status: validationResponse.status,
        confirmations,
        reason: validationResponse.reason || '',
      })

      // If we have enough confirmations, add the deposit to the user's account.
      const shouldCredit = confirmations >= minConfirmations

      if (shouldCredit) {
        await addCryptoDeposit({
          user,
          wallet,
          depositId: depositObjectId,
          transactionId: transaction.hash,
          amount: depositAmountUSD,
          confirmations,
          cryptoType: depositType,
          forcedReprocess,
        })
      }

      results.push({
        success: true,
        internal: false,
        depositId: depositObjectId,
        credited: shouldCredit,
        confirmations,
        userId: user.id,
      })
    } catch (error) {
      const message = `Error when processing Ethereum deposit transaction ${transaction.hash} for ${user.id} - ${error.message}`
      logger.error(message, { transaction, user, deposit }, error)

      results.push({
        success: false,
        error: message,
      })
    }
  }

  return results
}

export const processEtherscanTransaction = async (
  transaction: EtherscanInternalTransaction,
  latestBlockNumber: number,
  forcedReprocess?: boolean,
): Promise<ProcessEthereumTransactionResult[]> => {
  const deposits: EthereumDeposit[] = []
  const results: ProcessEthereumTransactionResult[] = []

  const ethDeposits = await getEthereumDeposits(transaction)
  deposits.push(...ethDeposits)

  if (!deposits.length) {
    return results
  }

  for (const deposit of deposits) {
    const { user, depositAmountUSD, depositId, depositType, meta } = deposit

    try {
      const depositObjectId = await startDeposit({
        user,
        depositType,
        network: 'Ethereum',
        amount: depositAmountUSD,
        currency: 'usd',
        depositId,
        externalId: transaction.hash,
        meta,
        forcedReprocess,
      })

      if (!depositObjectId) {
        cryptoLogger('ethereum/processEtherscanTransaction', {
          userId: user.id,
        }).error(
          `Ethereum Deposit - Could not create mongo deposit record for User ID: ${user.id} and Transaction ID: ${transaction.hash}`,
          {
            amount: depositAmountUSD,
            depositType,
            depositId,
            externalId: transaction.hash,
          },
        )
        continue
      }
      // Leave the already created deposit record in pending status and let the main ethereum
      // deposit worker pick it up in `batchConfirmationUpdate`.
      // TODO BD I am almost positive this does nothing but update the status
      // on the record. We could instead set it above and return early.

      // Update the number of confirmations using the head block.
      const confirmations = calculateConfirmations(
        latestBlockNumber,
        parseInt(transaction.blockNumber),
        0,
      )

      // Update the status of the deposit
      await updateDepositTransaction({
        _id: depositObjectId,
        status: 'pending',
        confirmations,
        reason: '',
      })

      results.push({
        success: true,
        internal: true,
        depositId: depositObjectId,
        userId: user.id,
      })
      continue
    } catch (error) {
      const message = `Error when processing Ethereum deposit transaction ${transaction.hash} for ${user.id}`
      cryptoLogger('ethereum/processEtherscanTransaction', {
        userId: user.id,
      }).error(message, { depositAmountUSD, depositId, depositType }, error)

      results.push({
        success: false,
        error: message,
      })
    }
  }

  return results
}

/**
 * Update confirmations on all pending deposit transactions.
 */
export async function batchConfirmationUpdate(
  web3: Web3Type,
  currentBlockNumber: number,
) {
  const logger = cryptoLogger('ethereum/batchConfirmationUpdate', {
    userId: null,
  })
  const pendingTransactions = await getPendingTransactionsOfType([
    'tether',
    'ethereum',
    'usdc',
  ])

  logger.info(`PENDING ETH: ${pendingTransactions}`, { currentBlockNumber })

  for (const trans of pendingTransactions) {
    const confirmations = await confirmPendingDeposit(
      web3,
      trans,
      currentBlockNumber,
    )

    if (trans.externalId && confirmations >= minConfirmations) {
      const wallet = await getEthereumWalletByUserId(trans.userId)
      if (!wallet) {
        logger.error(`No wallet found for transaction ${trans.id}`, {
          transaction: trans,
        })
        return
      }

      const user = await getUserById(trans.userId)
      if (!user) {
        logger.error(
          `Somehow there is no user for wallet ${wallet.id} with userId ${wallet.userId}`,
          { transaction: trans, wallet },
        )
        return
      }

      if (isValidCryptoDepositType(trans.depositType)) {
        await addCryptoDeposit({
          user,
          wallet,
          depositId: trans._id,
          transactionId: trans.externalId,
          amount: trans.amount,
          confirmations,
          cryptoType: trans.depositType,
        })
      }
    }
  }
}
