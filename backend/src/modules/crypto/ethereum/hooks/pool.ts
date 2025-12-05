import Web3 from 'web3'
import { toBN } from 'web3-utils'

import { config, MongoErrorCodes } from 'src/system'

import { getEthBalance } from '../lib/balance'
import { shouldPoolWallet } from '../lib/pooling/pooling'
import { getGasPriceUtility } from '../util'
import {
  type TransactionQueueHook,
  type PoolingMessage,
  isERC20Token,
} from '../types'
import {
  createWalletBalance,
  deleteWalletBalance,
  getBalanceByTokenAndAddress,
  updateWalletBalance,
  updateWalletBalanceByTokenAndAddress,
  deleteWalletBalanceById,
} from '../documents/ethereum_balances'
import { publishSendEthereumTransactionEvent } from '../rabbitmq'
import { cryptoLogger } from '../../lib/logger'

const GAS_PRICE_INCREASE = config.ethereum.gasMultiplierForBumping

export const poolingTransactionHooks: TransactionQueueHook<PoolingMessage> = {
  beforeEach: async ({ message }) => {
    const { walletAddress, token, tx } = message
    const gasPrice = tx.gasPrice ?? (await getGasPriceUtility())
    const logger = cryptoLogger('ethereum/pool/beforeEach', { userId: null })
    let value = tx.value

    if (token === 'eth') {
      const { balanceWei } = await getEthBalance(walletAddress)
      const gasCost = Number(gasPrice) * config.ethereum.gasLimit.standard

      // Set adjusted value
      const newValue = toBN(balanceWei).sub(toBN(gasCost))
      if (newValue.lt(toBN(0))) {
        logger.error(`${walletAddress} has a negative value`, {
          walletAddress,
          token,
          newValue,
        })
        throw {
          message,
        }
      }
      value = Web3.utils.numberToHex(newValue.toString())
    }

    const hexGasPrice = Web3.utils.numberToHex(gasPrice)
    if (tx.nonce) {
      return {
        shouldSend: true,
        message: {
          ...message,
          tx: {
            ...tx,
            gas: tx.gas ? Web3.utils.numberToHex(tx.gas) : tx.gas,
            gasPrice: hexGasPrice,
            value,
          },
        },
      }
    }

    const balanceDoc = await getBalanceByTokenAndAddress(walletAddress, token)
    if (!balanceDoc || balanceDoc.actionRequired !== 'pool') {
      logger.error(`missing wallet balance - ${walletAddress}`, {
        walletAddress,
        balanceDoc,
      })
      return {
        shouldSend: false,
        message: { ...message, tx: { ...tx, gasPrice: hexGasPrice, value } },
      }
    } else {
      const { shouldPool, balance } = await shouldPoolWallet(balanceDoc, token)
      if (!shouldPool) {
        if (balance !== undefined && balance <= 0) {
          await deleteWalletBalanceById(balanceDoc._id)
        } else {
          await updateWalletBalance(
            balanceDoc._id,
            balanceDoc.actionRequired,
            false,
          )
        }
      }

      return {
        shouldSend: shouldPool,
        message: {
          ...message,
          tx: {
            ...tx,
            gas: tx.gas ? Web3.utils.numberToHex(tx.gas) : tx.gas,
            gasPrice: hexGasPrice,
            value,
          },
        },
      }
    }
  },
  onSend: async ({ transactionHash }) => {
    cryptoLogger('etherium/pool/onSend', { userId: null }).info(
      `On send: ${transactionHash}`,
      { transactionHash },
    )
  },
  isTransactionConfirmed: async ({ message, transactionHash }) => {
    const { walletAddress, token } = message
    const provider = new Web3.providers.HttpProvider(
      config.ethereum.httpProvider,
    )
    const web3 = new Web3(provider)
    const logger = cryptoLogger('ethereum/pool/isTransactionConfirmed', {
      userId: null,
    })

    try {
      const receipt = await web3.eth.getTransactionReceipt(transactionHash)
      if (receipt) {
        return {
          isConfirmed: true,
          transaction: receipt,
        }
      }

      const transaction = await web3.eth.getTransaction(transactionHash)
      if (transaction) {
        return {
          isConfirmed: false,
          transaction,
        }
      }
    } catch (error) {
      logger.error(
        `Transaction ${transactionHash} not found - ${error.message}`,
        { transactionHash },
        error,
      )
    } finally {
      provider.disconnect()
    }

    logger.error('Transaction not found', { transactionHash })
    await updateWalletBalanceByTokenAndAddress(
      walletAddress,
      token,
      'pool',
      false,
    )
    return {
      isConfirmed: false,
      transaction: null,
    }
  },
  onReceipt: async ({ message, receipt }) => {
    const { walletAddress, token } = message
    cryptoLogger('ethereum/pool/onReceipt', { userId: null }).info(
      `${token} balance pooled for ${walletAddress}`,
      { token, receipt },
    )
    await deleteWalletBalance(walletAddress, token)

    // cleanup leftover funds on wallet
    if (isERC20Token(token)) {
      try {
        await createWalletBalance({
          address: walletAddress,
          token: 'eth',
          processing: false,
          actionRequired: 'pool',
        })
      } catch (error) {
        if (error.code !== MongoErrorCodes.DUPLICATE_KEY) {
          throw error
        }
      }
    }
  },
  shouldBump: async ({ message, transaction }) => {
    const latestGasPrice = await getGasPriceUtility()

    const oldGasPrice = Number(transaction.gasPrice)
    const gasPrice = Math.ceil(
      Math.max(oldGasPrice, latestGasPrice) * (1 + GAS_PRICE_INCREASE),
    )
    const oldGasPriceTooLow =
      parseInt(transaction.gasPrice) <
      Math.ceil(latestGasPrice / (1 + GAS_PRICE_INCREASE))

    return {
      shouldBump: oldGasPriceTooLow,
      gasPrice,
    }
  },
  onError: async ({ message, error }) => {
    const { walletAddress, token, tx } = message
    const isTimeoutError: boolean = error?.message?.includes(
      'Transaction was not mined within',
    )
    const isReplaceError: boolean =
      error?.message?.includes('future transaction tries to replace pending') ||
      error?.message?.includes('replacement transaction underpriced')

    if (isTimeoutError) {
      return
    }

    if (isReplaceError && !tx.nonce) {
      await publishSendEthereumTransactionEvent(message)
    }

    cryptoLogger('ethereum/pool/onError', { userId: null }).error(
      `Failed to pool ${token} balance for ${walletAddress} - ${error.message}`,
      { error, message },
    )
    // we should mark this as "processing: false" on error, because this transaction has left the pooling pipeline
    await updateWalletBalanceByTokenAndAddress(
      walletAddress,
      token,
      'pool',
      false,
    )
  },
}
