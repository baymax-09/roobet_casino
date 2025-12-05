import TronProvider from 'tronweb'
import { scopedLogger } from 'src/system/logger'

import {
  getNowBlock,
  getTransactionFromPending,
  submitTransaction,
  derivePoolingWallet,
  deriveTronUserWallet,
} from 'src/modules/crypto/tron/lib'
import {
  deleteWalletBalance,
  deleteWalletBalanceById,
  getWalletBalanceByTokenAndActionRequired,
  updateWalletBalance,
  updateWalletBalanceByTokenAndAddress,
} from 'src/modules/crypto/tron/documents/tron_balances'
import {
  getProvider,
  getSolidityProvider,
  getTrxPoolingWalletProvider,
  getTrxProvider,
} from 'src/modules/crypto/tron/util/getProvider'
import { sleep } from 'src/util/helpers/timer'

import {
  type TronToken,
  type Transaction,
  type TransactionInfo,
  isTronToken,
  TronAddressBase58V,
} from '../../types'
import {
  isConfirmationMessage,
  type OutboundTransactionQueueHook,
  type PoolingMessage,
} from '../../../types'
import {
  publishTronConfirmWithdrawMessage,
  publishTronPoolingMessage,
} from '../../rabbitmq'
import { shouldPoolWallet } from '../../lib/pooling/poolingMain'

const tronPoolingLogger = scopedLogger('tron-poolingTransactionQueue-hooks')

export type TronPoolHook = OutboundTransactionQueueHook<
  PoolingMessage<Transaction>,
  Transaction,
  TransactionInfo
>

export const TronPoolingHooks: TronPoolHook = {
  validationCheck: ({ message }) => {
    const { tx, signer } = message
    const { wallet, walletIndex } = signer
    const walletAddress = TronProvider.address.fromHex(
      tx.raw_data.contract[0].parameter.value.owner_address,
    )
    const logger = tronPoolingLogger('validationCheck', {
      userId: '',
    })

    if (!walletAddress) {
      const errorMessage = 'No Wallet Address'
      logger.error(errorMessage, {})
      return false
    }

    const provider = getProvider()
    const validAddress = provider.isAddress(walletAddress)
    if (!validAddress) {
      const errorMessage = 'Invalid Wallet Address'
      logger.error(errorMessage, {
        walletAddress,
      })
      return false
    }

    const isAddressPoolingMatch =
      wallet === 'pool' && derivePoolingWallet().address === walletAddress
    const isAddressUserMatch =
      wallet === 'user' &&
      deriveTronUserWallet(walletIndex).address === walletAddress

    // ensure that the message has the right information to sign the transaction later
    if (!(isAddressPoolingMatch || isAddressUserMatch)) {
      const errorMessage = 'Wallet address does not match the intended signer'
      logger.error(errorMessage, { signer })
      return false
    }

    return true
  },
  beforeEach: async ({ message }) => {
    const { tx, token, signer } = message
    const { wallet, walletAddress, walletIndex } = signer
    const logger = tronPoolingLogger('beforeEach', {
      userId: '',
    })

    if (!isTronToken(token)) {
      logger.error('Missing or incorrect token', { token })
      return {
        shouldSend: false,
        message,
      }
    }

    if (!TronAddressBase58V.is(walletAddress)) {
      logger.error('Signer address is unrecognized type', { walletAddress })
      return {
        shouldSend: false,
        message,
      }
    }

    const { shouldPool, shouldDeleteBalanceDoc } = await shouldPoolWallet(
      walletAddress,
      walletIndex,
      token,
    )

    // there is a unique pooling request
    if (wallet === 'user') {
      const balanceDoc = await getWalletBalanceByTokenAndActionRequired(
        walletAddress,
        token,
        'pool',
      )
      if (!balanceDoc) {
        logger.error('Missing Wallet Balance', { token, walletAddress })
        return {
          shouldSend: false,
          message: { ...message, tx },
        }
      }

      if (shouldDeleteBalanceDoc) {
        await deleteWalletBalanceById(balanceDoc._id)
      } else if (!shouldDeleteBalanceDoc && !shouldPool) {
        await updateWalletBalance(
          balanceDoc._id,
          balanceDoc.actionRequired,
          false,
        )
      }
    }

    return {
      shouldSend: shouldPool,
      message: { ...message, tx },
    }
  },
  sendTransaction: async ({ message, transaction }) => {
    const logger = tronPoolingLogger('TronSendTransaction', {
      userId: null,
    })
    const { signer } = message
    const { walletIndex, wallet } = signer
    // create a provider with the privateKey associated with the sender
    const fetchProvider = () => {
      if (wallet === 'pool') {
        return getTrxPoolingWalletProvider()
      }

      if (wallet === 'user') {
        return getTrxProvider(walletIndex)
      }
    }

    // Temp fix to slow down our sends, we seem to be sending messages to QuickNode too quickly
    await sleep(2000)

    try {
      const result = fetchProvider()
      if (!result) {
        const errorMessage = 'somehow a withdraw wallet message ended up here'
        logger.error(errorMessage, { message })
        throw new Error(errorMessage)
      }
      const { privateKey, provider } = result
      const currentBlockDataResp = await getNowBlock()
      const blockSent =
        currentBlockDataResp.result?.block_header.raw_data.number
      const transactionHash = await submitTransaction(
        provider,
        transaction,
        privateKey,
      )
      return { transactionHash, blockSent }
    } catch (error) {
      logger.error('Failed to submit transaction', transaction, error)
      throw error
    }
  },
  onSend: async ({ transactionHash }) => {
    const logger = tronPoolingLogger('onSend', {
      userId: '',
    })
    logger.info(`${transactionHash}`)
  },
  isPublishedTransaction: async ({ message }) => {
    const { token, signer } = message
    const { walletAddress } = signer
    const logger = tronPoolingLogger('isPublishedTransaction', { userId: '' })
    if (!message.transactionHash) {
      const errorMessage = 'no transaction hash'
      logger.error(errorMessage, {
        transactionHash: message.transactionHash,
        withdrawal: message,
      })
      return false
    }

    try {
      const provider = getProvider()
      const tx = await provider.trx.getTransaction(message.transactionHash)
      const txPending = await getTransactionFromPending(message.transactionHash)
      return Boolean(tx?.txID || txPending.result?.txID)
    } catch (error) {
      const errorMessage = 'Unknown error when querying transaction'
      logger.error(
        errorMessage,
        {
          transactionHash: message.transactionHash,
          withdrawal: message,
        },
        error,
      )

      // we should mark this as "processing: false" on error, because this transaction has left the pooling pipeline
      if (isTronToken(token) && TronAddressBase58V.is(walletAddress)) {
        await updateWalletBalanceByTokenAndAddress(
          walletAddress,
          token,
          'pool',
          false,
        )
      }

      return false
    }
  },
  isTransactionConfirmed: async ({ message, transactionHash }) => {
    const logger = tronPoolingLogger('isTransactionConfirmed', {
      userId: null,
    })
    const {
      token,
      signer: { walletAddress },
    } = message

    const blockAdditionTime = 1000 * 3
    await sleep(blockAdditionTime * 4)

    try {
      const provider = getSolidityProvider()
      const receipt = await provider.trx.getTransactionInfo(transactionHash)
      if (receipt) {
        if (token === 'trx') {
          return {
            isConfirmed: true,
            transaction: receipt,
          }
        }

        if (receipt.receipt.result === 'SUCCESS') {
          return {
            isConfirmed: true,
            transaction: receipt,
          }
        }
        logger.info(
          'receipt exists but is not successful -- transaction was reverted',
          receipt,
        )
        return {
          isConfirmed: false,
          transaction: null,
        }
      } else {
        const transaction =
          await provider.trx.getUnconfirmedTransactionInfo(transactionHash)
        if (transaction) {
          return {
            isConfirmed: false,
            transaction,
          }
        }
      }

      if (!TronAddressBase58V.is(walletAddress)) {
        logger.error('Signer address is unrecognized type', { walletAddress })
        return {
          isConfirmed: false,
          transaction: null,
        }
      }

      // if there's no transaction OR receipt then the transaction failed and we're exiting the process
      if (isTronToken(token)) {
        await updateWalletBalanceByTokenAndAddress(
          walletAddress,
          token,
          'pool',
          false,
        )
      }

      return {
        isConfirmed: false,
        transaction: null,
      }
    } catch (error) {
      const errorMessage =
        'Tron - Pooling - unknown error when querying transaction'
      logger.error(errorMessage, { transactionHash }, error)
      throw error
    }
  },
  onReceipt: async ({ message, receipt }) => {
    const {
      signer: { walletAddress },
    } = message
    const token = (message?.token ?? 'trx') as TronToken
    const logger = tronPoolingLogger('onReceipt', {
      userId: null,
    })
    logger.info(`${token} balance pooled for ${walletAddress}`, receipt)
    if (!TronAddressBase58V.is(walletAddress)) {
      logger.error('Signer address is unrecognized type', { walletAddress })
      return
    }

    await deleteWalletBalance(walletAddress, token)
  },
  bumpCheck: async ({ message }) => {
    // No need to bump in Tron
    return {
      shouldBump: false,
      message,
    }
  },
  onError: async ({ message }) => {
    const token = (message?.token ?? 'trx') as TronToken
    const {
      signer: { walletAddress },
    } = message
    const logger = tronPoolingLogger('onError', {
      userId: '',
    })

    logger.error(`Failed to pool ${token} balance for ${walletAddress}`, {
      message,
    })

    // we should mark this as "processing: false" on error, because this transaction has left the pooling pipeline
    if (TronAddressBase58V.is(walletAddress)) {
      await updateWalletBalanceByTokenAndAddress(
        walletAddress,
        token,
        'pool',
        false,
      )
    }

    return { shouldRetry: false }
  },
  publishOutboundMessage: async (message, messageOptions) => {
    await publishTronPoolingMessage(message, messageOptions)
  },
  publishConfirmMessage: async (message, messageOptions) => {
    if (isConfirmationMessage(message)) {
      await publishTronConfirmWithdrawMessage(message, messageOptions)
    }
  },
}
