import { scopedLogger } from 'src/system/logger'

import {
  getTransactionFromPending,
  submitTransaction,
  derivePoolingWallet,
  getTronWalletByAddress,
} from 'src/modules/crypto/tron/lib'
import {
  getWalletBalanceByTokenAndActionRequired,
  updateWalletBalance,
  updateWalletBalanceByTokenAndAddress,
} from 'src/modules/crypto/tron/documents/tron_balances'
import {
  getProvider,
  getSolidityProvider,
  getTrxPoolingWalletProvider,
} from 'src/modules/crypto/tron/util/getProvider'
import { sleep } from 'src/util/helpers/timer'

import {
  type TronToken,
  type Transaction,
  type TransactionInfo,
  isTronToken,
  TronAddressBase58V,
  isTRC20Token,
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
import { shouldFundWallet } from '../../lib/pooling/poolingTRC20'
import { buildApprovalMessage } from '../../lib/pooling/buildTransactionMessage'

const tronPoolingLogger = scopedLogger('tron-poolingTransactionQueue-hooks')

export type TronPoolHook = OutboundTransactionQueueHook<
  PoolingMessage<Transaction>,
  Transaction,
  TransactionInfo
>

/** Pooling Wallet sends funds to User Wallets that need to give Pooling Wallet authorization
 * to move TRC20 tokens for the first time
 */
export const TronFundingHooks: TronPoolHook = {
  validationCheck: ({ message }) => {
    const { signer } = message
    const { wallet, walletAddress } = signer
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

    // ensure that the message has the right information to sign the transaction later
    if (!isAddressPoolingMatch) {
      const errorMessage = 'Wallet address does not match the intended signer'
      logger.error(errorMessage, { signer })
      return false
    }

    return true
  },
  beforeEach: async ({ message }) => {
    const { tx, token, sendTo } = message
    const { walletAddress: userWalletAddress } = sendTo
    const logger = tronPoolingLogger('beforeEach', {
      userId: '',
    })

    if (!isTronToken(token) || !isTRC20Token(token)) {
      logger.error('Missing or incorrect token', { token })
      return {
        shouldSend: false,
        message,
      }
    }

    if (!TronAddressBase58V.is(userWalletAddress)) {
      logger.error('Recipient address is unrecognized type', {
        walletAddress: userWalletAddress,
      })
      return {
        shouldSend: false,
        message,
      }
    }

    const balanceDoc = await getWalletBalanceByTokenAndActionRequired(
      userWalletAddress,
      token,
      'fund',
    )
    if (!balanceDoc) {
      logger.error('Missing Wallet Balance', {
        token,
        walletAddress: userWalletAddress,
      })
      return {
        shouldSend: false,
        message: { ...message, tx },
      }
    }

    const { shouldFund } = await shouldFundWallet(userWalletAddress, token)

    if (!shouldFund) {
      logger.info('Should not fund', {
        shouldFund,
        walletAddress: userWalletAddress,
        token,
        balanceDoc,
      })
      await updateWalletBalance(
        balanceDoc._id,
        balanceDoc.actionRequired,
        false,
      )
    }

    return {
      shouldSend: shouldFund,
      message: { ...message, tx },
    }
  },
  sendTransaction: async ({ message, transaction }) => {
    const logger = tronPoolingLogger('TronSendTransaction', {
      userId: null,
    })

    // Temp fix to slow down our sends, we seem to be sending messages to QuickNode too quickly
    await sleep(2000)

    try {
      const result = getTrxPoolingWalletProvider()
      const { privateKey, provider } = result
      const transactionHash = await submitTransaction(
        provider,
        transaction,
        privateKey,
      )
      return { transactionHash, blockSent: undefined }
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
    const { token, sendTo } = message
    const { walletAddress: userWalletAddress } = sendTo
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
      if (isTronToken(token) && TronAddressBase58V.is(userWalletAddress)) {
        await updateWalletBalanceByTokenAndAddress(
          userWalletAddress,
          token,
          'fund',
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
      sendTo: { walletAddress: userWalletAddress },
    } = message

    const blockAdditionTime = 1000 * 3
    await sleep(blockAdditionTime * 4)

    try {
      const provider = getSolidityProvider()
      const receipt = await provider.trx.getTransactionInfo(transactionHash)
      // when funding, we're always sending TRX
      if (receipt) {
        return {
          isConfirmed: true,
          transaction: receipt,
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

      if (!TronAddressBase58V.is(userWalletAddress)) {
        logger.error('Recipient address is unrecognized type', {
          walletAddress: userWalletAddress,
        })
        return {
          isConfirmed: false,
          transaction: null,
        }
      }

      // if there's no transaction OR receipt then the transaction failed and we're exiting the process
      if (isTronToken(token)) {
        await updateWalletBalanceByTokenAndAddress(
          userWalletAddress,
          token,
          'fund',
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
      token,
      sendTo: { walletAddress: userWalletAddress },
      signer: { walletAddress: poolingWalletAddress },
    } = message
    const logger = tronPoolingLogger('onReceipt', {
      userId: null,
    })
    logger.info(`${token} balance pooled for ${userWalletAddress}`, receipt)
    if (!isTRC20Token(token)) {
      logger.error('Missing or incorrect token', { token })
      return
    }

    if (
      !TronAddressBase58V.is(userWalletAddress) ||
      !TronAddressBase58V.is(poolingWalletAddress)
    ) {
      logger.error('Recipient or Signer address is unrecognized type', {
        walletAddress: userWalletAddress,
        poolingWalletAddress,
      })
      return
    }

    const userWallet = await getTronWalletByAddress(userWalletAddress)
    if (!userWallet) {
      logger.error('Missing user wallet', { walletAddress: userWalletAddress })
      return
    }

    const approvalMessage = buildApprovalMessage({
      token,
      userWallet,
      walletToApprove: poolingWalletAddress,
    })

    await updateWalletBalanceByTokenAndAddress(
      userWalletAddress,
      token,
      'approve',
      true,
    )
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
      sendTo: { walletAddress: userWalletAddress },
    } = message
    const logger = tronPoolingLogger('onError', {
      userId: '',
    })

    logger.error(`Failed to fund ${token} balance for ${userWalletAddress}`, {
      message,
    })

    // we should mark this as "processing: false" on error, because this transaction has left the pooling pipeline
    if (TronAddressBase58V.is(userWalletAddress)) {
      await updateWalletBalanceByTokenAndAddress(
        userWalletAddress,
        token,
        'fund',
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
