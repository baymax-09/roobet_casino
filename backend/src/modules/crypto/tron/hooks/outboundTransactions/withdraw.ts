import {
  getWithdrawal,
  updateWithdrawal,
} from 'src/modules/withdraw/documents/withdrawals_mongo'

import { createNotification } from 'src/modules/messaging'
import {
  getProvider,
  getSolidityProvider,
  getTrxMainWalletProvider,
} from 'src/modules/crypto/tron/util/getProvider'
import {
  getNowBlock,
  getTransactionFromPending,
  submitTransaction,
} from 'src/modules/crypto/tron/lib/withdraw'
import { WithdrawStatusEnum } from 'src/modules/withdraw/types'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'
import { translateForUser } from 'src/util/i18n'
import { sleep } from 'src/util/helpers/timer'
import { scopedLogger } from 'src/system/logger'
import { recordSentTransfer } from 'src/vendors/chainalysis'
import { getUserById } from 'src/modules/user'

import {
  publishTronConfirmWithdrawMessage,
  publishTronPoolingMessage,
  publishTronWithdrawMessage,
} from '../../rabbitmq'
import {
  createOutgoingTransaction,
  updateOutgoingTransaction,
} from '../../../documents/outgoing_transactions'
import {
  getTronPrimaryWalletBalance,
  convertTrxToUserBalance,
  estimateTronBandwidth,
  getTrxBalance,
  derivePoolingWallet,
} from '../../lib'
import {
  isConfirmationMessage,
  type OutboundTransactionQueueHook,
  type WithdrawMessage,
} from '../../../types'
import { type Transaction, type TransactionInfo } from '../../types'
import { buildFinalTrxPoolingMessage } from '../../lib/pooling/buildTransactionMessage'
import { updateTokensToPool } from '../../lib/pooling/poolingMain'

export type TronWithdrawHook = OutboundTransactionQueueHook<
  WithdrawMessage<Transaction>,
  Transaction,
  TransactionInfo
>

const tronOutboundLogger = scopedLogger('tron-outboundTransactionQueue-hooks')

export const TronWithdrawHooks: TronWithdrawHook = {
  validationCheck: ({ message }) => {
    const { withdrawal, value } = message
    const logger = tronOutboundLogger('TronValidationCheck', {
      userId: message.withdrawal?.userId ?? null,
    })
    if (!withdrawal) {
      const errorMessage = 'Withdrawal - empty'
      logger.error(errorMessage)
      return false
    }

    const address = withdrawal.request.fields?.address
    if (!address) {
      const errorMessage = 'Withdrawal - no address'
      logger.error(errorMessage, { withdrawalId: withdrawal._id })
      return false
    }
    const provider = getProvider()
    const validAddress = provider.isAddress(address)
    if (!validAddress) {
      const errorMessage = 'Withdrawal - failed checksum'
      logger.error(errorMessage, { address, withdrawalId: withdrawal._id })
      return false
    }

    if (value < 0) {
      const errorMessage = 'Withdrawal - negative value'
      logger.error(errorMessage, { withdrawalId: withdrawal._id })
      return false
    }

    return true
  },
  beforeEach: async ({ message }) => {
    const { withdrawal, tx, fees } = message
    const logger = tronOutboundLogger('TronBeforeWithdrawal', {
      userId: message.withdrawal.userId,
    })

    const currentWithdrawal = await getWithdrawal(withdrawal._id.toString())

    const { usd } = await getTronPrimaryWalletBalance()
    let additionalFeeInUSD = 0

    // When roobet has to pay user withdrawal fee
    if (!fees || fees.userFeePaidUSD === 0) {
      const latestFee = await estimateTronBandwidth()
      additionalFeeInUSD = latestFee.usd
    }

    const totalAmountToSend = withdrawal.totalValue + additionalFeeInUSD
    if (usd <= totalAmountToSend) {
      const errorMessage = 'Insufficient funds in Tron main wallet'
      logger.error(errorMessage, {
        tx,
        withdrawalId: withdrawal._id,
        totalValue: withdrawal.totalValue,
        usd,
      })

      // check if pooling wallet has enough to cover this
      const { address: poolingWalletAddress } = derivePoolingWallet()
      const { usd: poolingWalletBalanceUSD } =
        await getTrxBalance(poolingWalletAddress)
      if (poolingWalletBalanceUSD > totalAmountToSend) {
        const message = await buildFinalTrxPoolingMessage()
        await publishTronPoolingMessage(message)
      } else {
        await updateTokensToPool('trx')
      }

      await updateWithdrawal(withdrawal._id.toString(), {
        status: WithdrawStatusEnum.REPROCESSING,
      })
      return {
        shouldSend: false,
        message: { ...message, tx },
      }
    }

    if (currentWithdrawal?.status !== WithdrawStatusEnum.PROCESSING) {
      return {
        shouldSend: false,
        message: { ...message, tx },
      }
    }

    return { shouldSend: true, message: { ...message, tx } }
  },
  sendTransaction: async ({ transaction }: { transaction: Transaction }) => {
    const logger = tronOutboundLogger('TronSendTransaction', { userId: null })
    // Temp fix to slow down our sends, we seem to be sending messages to QuickNode too quickly
    await sleep(2000)

    try {
      const { provider, privateKey } = getTrxMainWalletProvider()
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
  onSend: async ({ message, transactionHash, blockSent }) => {
    const {
      value,
      tx,
      sendTo: { walletAddress },
      withdrawal,
      fees,
    } = message
    const logger = tronOutboundLogger('TronOnSend', {
      userId: message.withdrawal.userId,
    })

    const user = await getUserById(withdrawal.userId)
    if (!user) {
      logger.error('No User for some reason')
      return
    }

    const updatedWithdraw = await updateWithdrawal(withdrawal._id.toString(), {
      transactionId: transactionHash,
      status: WithdrawStatusEnum.COMPLETED,
    })

    logger.info('Withdrawal - updated', {
      withdrawalId: updatedWithdraw?._id,
    })

    const convertedAmount = await exchangeAndFormatCurrency(value, user)
    const msg = translateForUser(user, 'withdrawal__convertedSent', [
      convertedAmount,
    ])

    try {
      await createNotification(user.id, msg, 'withdraw', {
        to: walletAddress,
        amount: value,
        token: 'trx',
        transactionId: transactionHash,
      })
    } catch (error) {
      logger.error(
        'Withdrawal - createNotification error',
        { transactionHash, withdrawalId: withdrawal._id },
        error,
      )
    }

    const {
      raw_data: { contract },
    } = tx
    const { parameter } = contract[0]
    const amount = parameter.value.amount

    try {
      if (amount) {
        await createOutgoingTransaction({
          network: 'Tron',
          transactionHash,
          token: 'trx',
          value: amount,
          blockSent,
          fees: {
            userFeePaid: fees.userFeePaid,
            totalFeePaid: 0,
            userFeePaidUSD: fees.userFeePaidUSD,
            totalFeePaidUSD: 0,
          },
        })
      }
      throw new Error('Tron - Invalid Withdraw Amount')
    } catch (error) {
      const errorMessage = 'Withdrawal - error with createOutgoingTransaction'
      logger.error(errorMessage, { tx, withdrawal }, error)
    }
  },
  isPublishedTransaction: async ({ message }) => {
    const logger = tronOutboundLogger('isPublishedTransaction', {
      userId: message.withdrawal.userId,
    })
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
      const errorMessage =
        'Withdrawal - unknown error when querying transaction'
      logger.error(
        errorMessage,
        {
          transactionHash: message.transactionHash,
          withdrawal: message.withdrawal,
        },
        error,
      )
      return false
    }
  },
  isTransactionConfirmed: async ({ message, transactionHash }) => {
    const logger = tronOutboundLogger('isTransactionConfirmed', {
      userId: null,
    })
    const { token } = message

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
        // exit with default return statement below
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

      return {
        isConfirmed: false,
        transaction: null,
      }
    } catch (error) {
      const errorMessage =
        'Tron - withdrawal - unknown error when querying transaction'
      logger.error(errorMessage, { transactionHash }, error)
      throw error
    }
  },
  onReceipt: async ({ message, receipt }) => {
    const provider = getProvider()
    const { withdrawal, fees } = message
    const logger = tronOutboundLogger('onReceipt', {
      userId: withdrawal.userId,
    })

    const { fee, id, blockNumber } = receipt

    const totalFeePaidTrx = parseFloat(provider.fromSun(fee))
    const totalFeePaidUSD = await convertTrxToUserBalance(totalFeePaidTrx)
    const feeUpdate = {
      userFeePaid: fees.userFeePaid,
      totalFeePaid: totalFeePaidTrx,
      userFeePaidUSD: fees.userFeePaidUSD,
      totalFeePaidUSD,
    }

    // this means the transaction was not validated on Tron network
    if (receipt.receipt && receipt.receipt.result !== 'SUCCESS') {
      const errorMessage = 'Withdrawal - transaction was reverted'
      logger.error(errorMessage, { receipt, withdrawal })
      await updateOutgoingTransaction('Tron', message.transactionHash || id, {
        status: 'reverted',
        fees: feeUpdate,
        blockConfirmed: blockNumber,
      })
    } else {
      await updateOutgoingTransaction('Tron', message.transactionHash || id, {
        status: 'completed',
        fees: feeUpdate,
        blockConfirmed: blockNumber,
      })
      recordSentTransfer(
        withdrawal.userId,
        message.transactionHash || id,
        message.sendTo.walletAddress,
        'tron',
      )
    }
  },
  bumpCheck: async ({ message }) => {
    // No need to bump in Tron
    return {
      shouldBump: false,
      message,
    }
  },
  publishOutboundMessage: async (message, messageOptions) => {
    await publishTronWithdrawMessage(message, messageOptions)
  },
  publishConfirmMessage: async (message, messageOptions) => {
    if (isConfirmationMessage(message)) {
      await publishTronConfirmWithdrawMessage(message, messageOptions)
    }
  },
  onError: async ({ message, error }) => {
    const { withdrawal } = message

    const isValidationError: boolean =
      error?.message?.includes('Validation failed')

    if (!isValidationError) {
      return {
        shouldRetry: true,
      }
    } else {
      await updateWithdrawal(withdrawal._id.toString(), {
        status: WithdrawStatusEnum.FAILED,
        reason: error.message,
      })
      return {
        shouldRetry: false,
      }
    }
  },
}
