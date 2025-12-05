import Web3 from 'web3'
import { fromWei } from 'web3-utils'
import numeral from 'numeral'

import { recordSentTransfer } from 'src/vendors/chainalysis'
import { createNotification } from 'src/modules/messaging'
import {
  getWithdrawal,
  updateWithdrawal,
} from 'src/modules/withdraw/documents/withdrawals_mongo'
import { WithdrawStatusEnum } from 'src/modules/withdraw/types'
import { config } from 'src/system'
import { translateForUser } from 'src/util/i18n'

import { getGasPriceUtility } from '../util'
import { getERC20Balance } from '../lib/balance'
import { updateTokensToPool } from '../lib/pooling/pooling'
import {
  type TransactionQueueHook,
  type WithdrawalMessage,
  isERC20Token,
} from '../types'
import { derivePrimaryEthWalletAddress, convertEtherToUserBalance } from '..'
import {
  createOutgoingTransaction,
  updateOutgoingTransaction,
} from '../../documents/outgoing_transactions'
import { publishSendEthereumTransactionEvent } from '../rabbitmq'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'
import { cryptoLogger } from '../../lib/logger'

const attemptLimit = 10
const GAS_PRICE_INCREASE = config.ethereum.gasMultiplierForBumping

export const withdrawalTransactionHooks: TransactionQueueHook<WithdrawalMessage> =
  {
    beforeEach: async ({ message }) => {
      const { withdrawal, tx, token, value } = message
      const logger = cryptoLogger('ethereum/withdraw/beforeEach', {
        userId: message.sendTo.user.id,
      })

      const address = withdrawal.request.fields?.address
      if (!address) {
        logger.error(`${withdrawal._id} has no address`, {
          withdrawal,
          address,
          token,
          value,
        })
        throw {
          message,
        }
      }

      const validAddress = Web3.utils.isAddress(address)
      if (!validAddress) {
        logger.error(`${withdrawal._id} failed checksum with ${address}`, {
          withdrawal,
          token,
          value,
        })
        throw {
          message,
        }
      }

      if (value < 0) {
        logger.error(`${withdrawal._id} has a negative value`, {
          withdrawal,
          token,
          value,
        })
        throw {
          message,
        }
      }

      const gasPrice = tx.gasPrice ?? (await getGasPriceUtility())

      if (isERC20Token(token)) {
        const mainWalletAddress = await derivePrimaryEthWalletAddress()
        const { balanceUSD } = await getERC20Balance(mainWalletAddress, token)
        logger.info(
          `Main wallet balance: ${balanceUSD} withdrawal amount: ${withdrawal.totalValue}`,
          { withdrawal, token, value, balanceUSD },
        )

        const isMainWalletBalanceTooLow = balanceUSD <= withdrawal.totalValue
        if (isMainWalletBalanceTooLow) {
          logger.info(
            `Insufficient funds in main wallet. main wallet balance: ${balanceUSD} withdrawal amount: ${withdrawal.totalValue}`,
            { withdrawal, token, value, balanceUSD },
          )
          await updateTokensToPool(token)
          // we are setting the status to Reprocessing
          // (slight delay before the withdrawal is picked up again) to give us time to pool
          await updateWithdrawal(withdrawal._id.toString(), {
            status: WithdrawStatusEnum.REPROCESSING,
          })
          return {
            shouldSend: false,
            message: { ...message, tx: { ...tx, gasPrice } },
          }
        }
      }

      if (tx.nonce) {
        return {
          shouldSend: true,
          message: { ...message, tx: { ...tx, gasPrice } },
        }
      }

      logger.info(`${withdrawal._id}`, { withdrawal, token, value })

      const currentWithdrawal = await getWithdrawal(withdrawal._id.toString())

      if (currentWithdrawal?.status !== WithdrawStatusEnum.PROCESSING) {
        return {
          shouldSend: false,
          message: { ...message, tx: { ...tx, gasPrice } },
        }
      }

      return {
        shouldSend: true,
        message: { ...message, tx: { ...tx, gasPrice } },
      }
    },
    onSend: async ({ message, transactionHash, blockSent }) => {
      const {
        value,
        tx,
        sendTo: { user, walletAddress },
        token,
        withdrawal,
        fees,
      } = message
      const logger = cryptoLogger('ethereum/withdraw/onSend', {
        userId: user.id,
      })

      logger.info(`${withdrawal._id} - ${transactionHash}`, { message })

      const updatedWithdraw = await updateWithdrawal(
        withdrawal._id.toString(),
        {
          transactionId: transactionHash,
          status: WithdrawStatusEnum.COMPLETED,
        },
      )

      logger.info(`${updatedWithdraw}`, { updatedWithdraw, message })

      // If the transaction was bumped, we don't want to create a transaction or notification
      if (tx.nonce) {
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
          transactionId: transactionHash,
          type: token,
        })
      } catch (error) {
        logger.error(
          `Failed to create notification: ${error.message}`,
          {
            to: walletAddress,
            amount: value,
            transactionId: transactionHash,
            type: token,
          },
          error,
        )
      }

      try {
        recordSentTransfer(
          user.id,
          transactionHash,
          walletAddress,
          withdrawal.plugin,
        )

        const { value = '0' } = tx
        const valueETH = parseFloat(fromWei(value.toString(), 'ether'))
        await createOutgoingTransaction({
          network: 'Ethereum',
          transactionHash,
          token,
          value: valueETH,
          blockSent,
          fees: {
            userFeePaid: fees.userFeePaid,
            totalFeePaid: 0,
            userFeePaidUSD: fees.userFeePaidUSD,
            totalFeePaidUSD: 0,
          },
        })
      } catch (error) {
        logger.error(
          `Error with postSend hooks for ${withdrawal._id}: ${transactionHash}`,
          { withdrawal, transactionHash, walletAddress },
          error,
        )
      }
    },
    isTransactionConfirmed: async ({ message, transactionHash }) => {
      const provider = new Web3.providers.HttpProvider(
        config.ethereum.httpProvider,
      )
      const web3 = new Web3(provider)
      const logger = cryptoLogger('ethereum/withdraw/isTransactionConfirmed', {
        userId: message.sendTo.user.id,
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
          `Transaction ${transactionHash} not found: ${error.message}`,
          { transactionHash },
          error,
        )
      } finally {
        provider.disconnect()
      }

      logger.error(`Transaction ${transactionHash} not found`, {
        transactionHash,
      })
      return {
        isConfirmed: false,
        transaction: null,
      }
    },
    onReceipt: async ({ message, receipt }) => {
      const { token, withdrawal, fees } = message
      const logger = cryptoLogger('ethereum/withdraw/onReceipt', {
        userId: message.sendTo.user.id,
      })

      logger.info(`${withdrawal._id}: ${receipt}`, {
        token,
        withdrawal,
        fees,
        receipt,
      })

      const totalGasUsedInWei = receipt.effectiveGasPrice * receipt.gasUsed
      const totalFeePaidETH = parseFloat(
        fromWei(`${totalGasUsedInWei}`, 'ether'),
      )
      const totalFeePaidUSD = await convertEtherToUserBalance(totalFeePaidETH)
      const feeUpdate = {
        userFeePaid: fees.userFeePaid,
        totalFeePaid: totalFeePaidETH,
        userFeePaidUSD: fees.userFeePaidUSD,
        totalFeePaidUSD,
      }

      // this means the EVM reverted the transaction
      if (!receipt.status) {
        if (isERC20Token(token)) {
          logger.info(
            `Receipt has a status of false ${message.withdrawal._id}: ${receipt}`,
            { token, withdrawal, fees: feeUpdate, receipt },
          )
          const mainWalletAddress = await derivePrimaryEthWalletAddress()
          // this triggers a balance check to see if we need to pool ERC20 Token
          const { balanceUSD } = await getERC20Balance(mainWalletAddress, token)
          if (balanceUSD <= withdrawal.totalValue) {
            await updateTokensToPool(token)
            // we are setting the status to Reprocessing (slight delay before the withdrawal is picked up again)
            // to give us time to pool
            await updateWithdrawal(withdrawal._id.toString(), {
              status: WithdrawStatusEnum.REPROCESSING,
            })
          }
        }
        await updateOutgoingTransaction(
          'Ethereum',
          message.transactionHash || receipt.transactionHash,
          {
            status: 'reverted',
            fees: feeUpdate,
            blockConfirmed: receipt.blockNumber,
          },
        )
      } else {
        await updateOutgoingTransaction(
          'Ethereum',
          message.transactionHash || receipt.transactionHash,
          {
            status: 'completed',
            fees: feeUpdate,
            blockConfirmed: receipt.blockNumber,
          },
        )
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
      const {
        attempts = 0,
        value,
        withdrawal,
        tx,
        sendTo: { walletAddress },
        token,
      } = message
      const amount = numeral(value).format('0,0.00')

      const isFundsError: boolean =
        error?.message?.includes('insufficient funds')
      const isNonceError: boolean = error?.message?.includes('nonce too low')
      const isTimeoutError: boolean = error?.message?.includes(
        'Transaction was not mined within',
      )
      const isReplaceError: boolean =
        error?.message?.includes(
          'future transaction tries to replace pending',
        ) || error?.message?.includes('replacement transaction underpriced')
      const isValidErrorForRetry =
        isFundsError || isNonceError || isReplaceError

      // Let pooling worker know that is should pool due to insufficient main wallet funds
      // update with withdrawal record so we back off of this and give time to pool
      if (isFundsError) {
        await updateTokensToPool(token)
        await updateWithdrawal(withdrawal._id.toString(), {
          status: WithdrawStatusEnum.REPROCESSING,
        })
        return
      }

      cryptoLogger('ethereum/withdraw/onError', {
        userId: message.sendTo.user.id,
      }).error(
        `Withdrawl error ${withdrawal._id}: failed to send ${amount} to ${walletAddress} (retry: ${isValidErrorForRetry}) - ${error.message}`,
        { message, error },
      )

      if (isTimeoutError) {
        return
      }

      const shouldRetryInitialSend = isValidErrorForRetry && !tx.nonce

      if (attempts < attemptLimit && shouldRetryInitialSend) {
        await publishSendEthereumTransactionEvent({
          ...message,
          attempts: attempts + 1,
        })
      } else {
        // TODO system for error/failure reason codes and lookups
        const errorMessage = 'Unknown Error has occurred.'
        await updateWithdrawal(withdrawal._id.toString(), {
          status: WithdrawStatusEnum.FAILED,
          reason: errorMessage,
        })
      }
    },
  }
