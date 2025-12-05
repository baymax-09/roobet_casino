import Web3 from 'web3'

import { config } from 'src/system'

import { shouldApproveWallet } from '../lib/pooling/pooling'
import { getGasPriceUtility } from '../util'
import {
  getBalanceByTokenAndAddress,
  updateWalletBalanceByTokenAndAddress,
} from '../documents/ethereum_balances'
import { buildERC20PoolingMessage } from '../lib/pooling/buildTransactionMessage'
import { type ApproveERC20Message, type TransactionQueueHook } from '../types'
import { derivePrimaryEthWalletAddress } from '..'
import { publishSendEthereumTransactionEvent } from '../rabbitmq'
import { cryptoLogger } from '../../lib/logger'

const GAS_PRICE_INCREASE = config.ethereum.gasMultiplierForBumping

export const approveTransactionHooks: TransactionQueueHook<ApproveERC20Message> =
  {
    beforeEach: async ({ message }) => {
      const { token, walletAddress, tx } = message
      const gasPrice = tx.gasPrice ?? (await getGasPriceUtility())
      const logger = cryptoLogger('ethereum/approve/beforeEach', {
        userId: null,
      })

      if (tx.nonce) {
        return {
          shouldSend: true,
          message: { ...message, tx: { ...tx, gasPrice } },
        }
      }

      const balanceDoc = await getBalanceByTokenAndAddress(walletAddress, token)

      if (!balanceDoc || balanceDoc.actionRequired !== 'approve') {
        logger.error(`missing wallet balance - ${walletAddress}`, {
          walletAddress,
          token,
          tx,
        })
        return {
          shouldSend: false,
          message: { ...message, tx: { ...tx, gasPrice } },
        }
      } else {
        const shouldApprove = await shouldApproveWallet(balanceDoc, token)
        if (!shouldApprove) {
          logger.info('should not approve', {
            shouldApprove,
            walletAddress,
            token,
            tx,
          })
          await updateWalletBalanceByTokenAndAddress(
            walletAddress,
            token,
            balanceDoc.actionRequired,
            false,
          )
        }
        return {
          shouldSend: shouldApprove,
          message: { ...message, tx: { ...tx, gasPrice } },
        }
      }
    },
    onSend: async ({ transactionHash }) => {
      cryptoLogger('ethereum/approve/onSend', { userId: null }).info(
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
      const logger = cryptoLogger('ethereum/approve/isTransactionConfirmed', {
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

      logger.error(`Transaction ${transactionHash} not found`, {
        transactionHash,
      })
      await updateWalletBalanceByTokenAndAddress(
        walletAddress,
        token,
        'approve',
        false,
      )
      return {
        isConfirmed: false,
        transaction: null,
      }
    },
    onReceipt: async ({ message, receipt }) => {
      const { walletAddress, token } = message
      cryptoLogger('ethereum/approve/onReceipt', { userId: null }).info(
        `${token} approved for ${walletAddress}`,
        { token, receipt, walletAddress },
      )
      const mainWallet = await derivePrimaryEthWalletAddress()

      // Push this along to be pulled now that approval has succeeded
      const poolMessage = await buildERC20PoolingMessage({
        token,
        userWalletAddress: walletAddress,
        mainWalletAddress: mainWallet,
      })
      await updateWalletBalanceByTokenAndAddress(
        walletAddress,
        token,
        'pool',
        true,
      )
      publishSendEthereumTransactionEvent(poolMessage)
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
        error?.message?.includes(
          'future transaction tries to replace pending',
        ) || error?.message?.includes('replacement transaction underpriced')

      if (isTimeoutError) {
        return
      }

      if (isReplaceError && !tx.nonce) {
        await publishSendEthereumTransactionEvent(message)
      }

      cryptoLogger('ethereum/approve/onError', { userId: null }).error(
        `Failed to approve ${token} for ${walletAddress} - ${error.message}`,
        { token, walletAddress, error },
      )
      // we should mark this as "processing: false" on error, because this transaction has left the pooling pipeline
      await updateWalletBalanceByTokenAndAddress(
        walletAddress,
        token,
        'approve',
        false,
      )
    },
  }
