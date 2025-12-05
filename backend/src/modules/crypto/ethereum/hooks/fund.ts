import Web3 from 'web3'

import { config } from 'src/system'

import { getWalletByAddress } from '../documents/ethereum_wallets'
import { shouldFundWallet } from '../lib/pooling/pooling'
import { type FundETHMessage, type TransactionQueueHook } from '../types'
import { getGasPriceUtility } from '../util'
import { derivePrimaryEthWalletAddress } from '..'
import { cryptoLogger } from '../../lib/logger'
import {
  getBalanceByTokenAndAddress,
  updateWalletBalanceByTokenAndAddress,
} from '../documents/ethereum_balances'
import { buildApprovalMessage } from '../lib/pooling/buildTransactionMessage'
import { publishSendEthereumTransactionEvent } from '../rabbitmq'

const GAS_PRICE_INCREASE = config.ethereum.gasMultiplierForBumping

export const fundEthTransactionHooks: TransactionQueueHook<FundETHMessage> = {
  beforeEach: async ({ message }) => {
    const { walletAddress, token, tx } = message
    const gasPrice = tx.gasPrice ?? (await getGasPriceUtility())
    const logger = cryptoLogger('ethereum/fund/beforeEach', { userId: null })
    // This is a bumped transaction and should go through
    if (tx.nonce) {
      return {
        shouldSend: true,
        message: { ...message, tx: { ...tx, gasPrice } },
      }
    }

    const balanceDoc = await getBalanceByTokenAndAddress(walletAddress, token)
    if (!balanceDoc || balanceDoc.actionRequired !== 'fund') {
      logger.error(`Missing wallet balance - ${walletAddress}`, {
        walletAddress,
        token,
        balanceDoc,
      })
      return {
        shouldSend: false,
        message: { ...message, tx: { ...tx, gasPrice } },
      }
    } else {
      const { shouldFund } = await shouldFundWallet(walletAddress, token)
      if (!shouldFund) {
        logger.info('Should not fund', {
          shouldFund,
          walletAddress,
          token,
          balanceDoc,
        })
        await updateWalletBalanceByTokenAndAddress(
          walletAddress,
          token,
          balanceDoc.actionRequired,
          false,
        )
      }
      return {
        shouldSend: shouldFund,
        message: { ...message, tx: { ...tx, gasPrice } },
      }
    }
  },
  onSend: async ({ transactionHash }) => {
    cryptoLogger('ethereum/fund/onSend', { userId: null }).info(
      `${transactionHash}`,
      { transactionHash },
    )
  },
  isTransactionConfirmed: async ({ message, transactionHash }) => {
    const { walletAddress, token } = message
    const provider = new Web3.providers.HttpProvider(
      config.ethereum.httpProvider,
    )
    const web3 = new Web3(provider)
    const logger = cryptoLogger('ethereum/fund/isTransactionConfirmed', {
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
        { transactionHash, walletAddress, token },
        error,
      )
    } finally {
      provider.disconnect()
    }

    logger.error('Transaction not found', {
      transactionHash,
      walletAddress,
      token,
    })
    await updateWalletBalanceByTokenAndAddress(
      walletAddress,
      token,
      'fund',
      false,
    )
    return {
      isConfirmed: false,
      transaction: null,
    }
  },
  onReceipt: async ({ message, receipt }) => {
    const { walletAddress, token } = message
    const wallet = await getWalletByAddress(walletAddress)
    if (!wallet) {
      throw new Error(`fund - beforeEach - missing wallet - ${walletAddress}`)
    }
    cryptoLogger('ethereum/fund/onReceipt', { userId: wallet.userId }).info(
      `${walletAddress}`,
      { receipt, walletAddress, token },
    )

    const mainWallet = await derivePrimaryEthWalletAddress()

    const approvalMessage = buildApprovalMessage({
      token,
      userWallet: wallet,
      walletToApprove: mainWallet,
    })
    await updateWalletBalanceByTokenAndAddress(
      walletAddress,
      token,
      'approve',
      true,
    )
    publishSendEthereumTransactionEvent(approvalMessage)
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

    cryptoLogger('ethereum/fund/onError', { userId: null }).error(
      `Failed to fund ${walletAddress} - ${error.message}`,
      { walletAddress, token, error },
    )
    // we should mark this as "processing: false" on error, because this transaction has left the pooling pipeline
    await updateWalletBalanceByTokenAndAddress(
      walletAddress,
      token,
      'fund',
      false,
    )
  },
}
