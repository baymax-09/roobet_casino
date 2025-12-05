import {
  Client,
  dropsToXrp,
  isValidAddress,
  type Payment,
  type Transaction,
} from 'xrpl'

import { config } from 'src/system'
import {
  getWithdrawal,
  updateWithdrawal,
} from 'src/modules/withdraw/documents/withdrawals_mongo'
import {
  getTransaction,
  getRippleFee,
  derivePrimaryWallet,
  getRippleBalance,
} from 'src/modules/crypto/ripple/lib'
import { createNotification } from 'src/modules/messaging'
import { WithdrawStatusEnum } from 'src/modules/withdraw/types'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'
import { translateForUser } from 'src/util/i18n'
import { sleep } from 'src/util/helpers/timer'
import { scopedLogger } from 'src/system/logger'
import { recordSentTransfer } from 'src/vendors/chainalysis'
import { getUserById } from 'src/modules/user'

import {
  publishRippleConfirmWithdrawMessage,
  publishRippleWithdrawMessage,
} from '../../rabbitmq'
import {
  createOutgoingTransaction,
  updateOutgoingTransaction,
} from '../../../documents/outgoing_transactions'
import {
  convertXrpToUserBalance,
  estimateRippleFee,
  submitTransaction,
} from '../../lib'
import {
  type WithdrawMessage,
  type OutboundTransactionQueueHook,
  isConfirmationMessage,
} from '../../../types'
import { type RippleTransaction } from '../../types'

export type RippleOutboundTransactionHook = OutboundTransactionQueueHook<
  WithdrawMessage<Transaction>,
  Transaction,
  RippleTransaction
>

const xrpOutboundLogger = scopedLogger('xrp-outboundTransactionQueue-hooks')

export const RippleOutboundTransactionHooks: RippleOutboundTransactionHook = {
  validationCheck: ({ message }) => {
    const { withdrawal, value } = message
    const logger = xrpOutboundLogger('validationCheck', {
      userId: message.withdrawal.userId,
    })

    const address = withdrawal.request.fields?.address
    if (!address) {
      const errorMessage = 'Ripple - withdrawal - no address'
      logger.error(errorMessage, { withdrawalId: withdrawal._id })
      return false
    }

    const validAddress = isValidAddress(address)
    if (!validAddress) {
      const errorMessage = 'Ripple - withdrawal - failed checksum'
      logger.error(errorMessage, { address, withdrawalId: withdrawal._id })
      return false
    }

    if (value < 0) {
      const errorMessage = 'Ripple - withdrawal - negative value'
      logger.error(errorMessage, { withdrawalId: withdrawal._id })
      return false
    }

    return true
  },
  beforeEach: async ({ message }) => {
    const { withdrawal, tx, fees } = message
    const logger = xrpOutboundLogger('beforeWithdrawal', {
      userId: message.withdrawal.userId,
    })

    const Fees = await estimateRippleFee()
    const Fee = tx.Fee ?? Fees.drops.toString()

    if (tx.Sequence) {
      const errorMessage =
        'Ripple - withdrawal - transaction has a Sequence number'
      logger.error(errorMessage, { tx, withdrawalId: withdrawal._id })
      return { shouldSend: true, message: { ...message, tx: { ...tx, Fee } } }
    }

    const currentWithdrawal = await getWithdrawal(withdrawal._id.toString())

    const mainWalletAddress = derivePrimaryWallet().classicAddress
    const xrpBalance = await getRippleBalance(mainWalletAddress)
    const balanceUSD = await convertXrpToUserBalance(Number(xrpBalance))
    let additionalFeeInUSD = 0

    // When roobet has to pay user withdrawal fee
    if (!fees || fees.userFeePaidUSD === 0) {
      additionalFeeInUSD = Fees.usd
    }

    if (balanceUSD <= withdrawal.totalValue + additionalFeeInUSD) {
      const errorMessage = 'Insufficient funds in Ripple main wallet'
      logger.error(errorMessage, {
        tx,
        withdrawalId: withdrawal._id,
        totalValue: withdrawal.totalValue,
        balanceUSD,
      })

      // there is no pooling in xrp, so we need to discus further
      await updateWithdrawal(withdrawal._id.toString(), {
        status: WithdrawStatusEnum.REPROCESSING,
      })
      return {
        shouldSend: false,
        message: { ...message, tx: { ...tx, Fee } },
      }
    }

    if (currentWithdrawal?.status !== WithdrawStatusEnum.PROCESSING) {
      return {
        shouldSend: false,
        message: { ...message, tx: { ...tx, Fee } },
      }
    }

    return { shouldSend: true, message: { ...message, tx: { ...tx, Fee } } }
  },
  sendTransaction: async ({ transaction }) => {
    const logger = xrpOutboundLogger('sendTransaction', { userId: null })
    // Temp fix to slow down our sends, we seem to be sending messages to QuickNode too quickly
    await sleep(2000)
    const client = new Client(config.ripple.wsProvider)
    await client.connect()

    try {
      const ledgerIndex = await client.getLedgerIndex()
      const transactionHash = await submitTransaction(client, transaction, {
        wallet: derivePrimaryWallet(),
      })
      return { transactionHash, blockSent: ledgerIndex }
    } catch (error) {
      logger.error('Ripple - failed to submit transaction', transaction, error)
      throw error
    } finally {
      await client.disconnect()
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
    const logger = xrpOutboundLogger('onSend', {
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

    logger.info('Ripple - withdrawal - updated', {
      withdrawalId: updatedWithdraw?._id,
    })

    // If the transaction was bumped, we don't want to create a transaction or notification
    // TODO there might be more clean up we could do here
    if (tx.Sequence) {
      const errorMessage =
        'Ripple - withdrawal - transaction has a Sequence number'
      logger.error(errorMessage, { tx, withdrawal })
      return
    }

    const convertedAmount = await exchangeAndFormatCurrency(value, user)
    const msg = translateForUser(user, 'withdrawal__convertedSent', [
      convertedAmount,
    ])

    try {
      await createNotification(user.id, msg, 'withdraw', {
        to: walletAddress,
        amount: value,
        token: 'xrp',
        transactionId: transactionHash,
      })
    } catch (error) {
      logger.error(
        'Ripple - withdrawal - createNotification error',
        { transactionHash, withdrawalId: withdrawal._id },
        error,
      )
    }

    const { Amount } = tx as Payment

    const isAmountInXRP = typeof Amount === 'string'
    if (isAmountInXRP || Amount.currency !== 'XRP') {
      const errorMessage =
        'Ripple - withdrawal - transaction amount or currency is incorrect'
      logger.error(errorMessage, { tx, withdrawal })
      return
    }

    try {
      await createOutgoingTransaction({
        network: 'Ripple',
        transactionHash,
        token: 'xrp',
        value: parseFloat(dropsToXrp(Amount.value)),
        blockSent,
        fees: {
          userFeePaid: fees.userFeePaid,
          totalFeePaid: 0,
          userFeePaidUSD: fees.userFeePaidUSD,
          totalFeePaidUSD: 0,
        },
      })
    } catch (error) {
      const errorMessage =
        'Ripple - withdrawal - error with createOutgoingTransaction'
      logger.error(errorMessage, { tx, withdrawal }, error)
    }
  },
  isPublishedTransaction: async ({ message }) => {
    const logger = xrpOutboundLogger('isPublishedTransaction', {
      userId: message.withdrawal.userId,
    })
    const client = new Client(config.ripple.wsProvider)

    try {
      await client.connect()
      const tx = await getTransaction(client, message.transactionHash ?? '')
      return Boolean(tx?.result.ledger_index)
    } catch (error) {
      const errorMessage =
        'Ripple - withdrawal - unknown error when querying transaction'
      logger.error(
        errorMessage,
        {
          transactionHash: message.transactionHash,
          withdrawal: message.withdrawal,
        },
        error,
      )
      return false
    } finally {
      await client.disconnect()
    }
  },
  isTransactionConfirmed: async ({ transactionHash }) => {
    const logger = xrpOutboundLogger('isTransactionConfirmed', {
      userId: null,
    })
    await sleep(10000)

    const client = new Client(config.ripple.wsProvider)
    await client.connect()

    try {
      const receipt = await getTransaction(client, transactionHash)
      if (receipt) {
        if (receipt.result.validated) {
          return {
            isConfirmed: true,
            transaction: receipt,
          }
        }
        return {
          isConfirmed: false,
          transaction: receipt,
        }
      }

      return {
        isConfirmed: false,
        transaction: null,
      }
    } catch (error) {
      const errorMessage =
        'Ripple - withdrawal - unknown error when querying transaction'
      logger.error(errorMessage, { transactionHash }, error)
      throw error
    } finally {
      await client.disconnect()
    }
  },
  onReceipt: async ({ message, receipt }) => {
    const { withdrawal, fees } = message
    const logger = xrpOutboundLogger('onReceipt', {
      userId: withdrawal.userId,
    })

    const { Fee, hash, ledger_index, validated } = receipt.result
    const totalFeePaidXRP = parseFloat(dropsToXrp(Fee ?? '0'))
    const totalFeePaidUSD = await convertXrpToUserBalance(totalFeePaidXRP)
    const feeUpdate = {
      userFeePaid: fees.userFeePaid,
      totalFeePaid: totalFeePaidXRP,
      userFeePaidUSD: fees.userFeePaidUSD,
      totalFeePaidUSD,
    }

    // this means the transaction was not validated on Ripple network
    if (!validated) {
      const errorMessage = 'Ripple - withdrawal - transaction was reverted'
      logger.error(errorMessage, { receipt, withdrawal })
      await updateOutgoingTransaction(
        'Ripple',
        message.transactionHash || hash,
        { status: 'reverted', fees: feeUpdate, blockConfirmed: ledger_index },
      )
    } else {
      await updateOutgoingTransaction(
        'Ripple',
        message.transactionHash || hash,
        {
          status: 'completed',
          fees: feeUpdate,
          blockConfirmed: ledger_index,
        },
      )
      recordSentTransfer(
        withdrawal.userId,
        message.transactionHash || hash,
        message.sendTo.walletAddress,
        withdrawal.plugin,
      )
    }
  },
  bumpCheck: async ({ message, transactionHash }) => {
    const { withdrawal } = message
    const logger = xrpOutboundLogger('bumpCheck', {
      userId: withdrawal.userId,
    })
    const client = new Client(config.ripple.wsProvider)
    await client.connect()

    try {
      const transaction = await getTransaction(client, transactionHash)
      if (!transaction) {
        const errorMessage = 'Ripple - withdrawal - transaction not found'
        logger.error(errorMessage, { transactionHash, withdrawal })
        return
      }
      const txFee = parseFloat(transaction.result.Fee || '0')
      const latestFee = await getRippleFee(client)
      const FEE_INCREASE = 0.5 // 50% increase, 10 drop to 15 drop, it's sufficient for ripple transactions

      const fee = Math.ceil(Math.max(txFee, latestFee) * (1 + FEE_INCREASE))
      const oldFeeTooLow = txFee < Math.ceil(latestFee / (1 + FEE_INCREASE))

      if (oldFeeTooLow) {
        const infoMessage = 'Ripple - withdrawal - bumping transaction'
        logger.info(infoMessage, { transaction, withdrawal })
        return {
          shouldBump: true,
          message: {
            ...message,
            transactionHash,
            tx: {
              ...message.tx,
              Fee: fee.toString(),
              Sequence: transaction.result.Sequence ?? 0,
            },
          },
        }
      }
      return {
        shouldBump: false,
        message,
      }
    } catch (error) {
      logger.error(
        'Ripple - withdrawal - unknown error',
        { transactionHash },
        error,
      )
      throw error
    } finally {
      await client.disconnect()
    }
  },
  publishOutboundMessage: async (message, messageOptions) => {
    await publishRippleWithdrawMessage(message, messageOptions)
  },
  publishConfirmMessage: async (message, messageOptions) => {
    if (isConfirmationMessage(message)) {
      await publishRippleConfirmWithdrawMessage(message, messageOptions)
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
