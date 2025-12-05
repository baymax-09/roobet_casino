import { Client, dropsToXrp } from 'xrpl'

import { config } from 'src/system'
import { getUserById } from 'src/modules/user'
import { createUniqueDepositId } from 'src/modules/deposit/lib/util'

import { getRippleTag } from '../documents/ripple_tags'
import {
  convertXrpToUserBalance,
  derivePrimaryWallet,
  getTransaction,
} from '../lib'
import { type InboundTransactionQueueHook } from '../../types'
import {
  isPaymentTransaction,
  isAccountDeleteTransaction,
  type RippleDeposit,
  type RippleTransaction,
} from '../types'
import { cryptoLogger } from '../../lib/logger'

export const RippleInboundTransactionHooks: InboundTransactionQueueHook<
  RippleTransaction,
  RippleDeposit
> = {
  fetchTransactionData: async message => {
    const { hashes } = message
    const transactionDataArr = []

    const client = new Client(config.ripple.wsProvider)
    await client.connect()

    for (const hash of hashes) {
      const transactionData = await getTransaction(client, hash)
      transactionDataArr.push(transactionData)
    }

    await client.disconnect()

    return {
      transactions: transactionDataArr,
    }
  },
  filterTransactions: async transactions => {
    const logger = cryptoLogger(
      'ripple/inboundTransactions/filterTransactions',
      { userId: null },
    )
    const depositTransactionArr = []
    logger.info(`Ripple filterTransactions - ${transactions[0]}`)
    for (const transaction of transactions) {
      const { result } = transaction
      if (
        !isPaymentTransaction(result) &&
        !isAccountDeleteTransaction(result)
      ) {
        continue
      }

      const { DestinationTag, Destination, hash, meta } = result
      if (!meta || typeof meta === 'string') {
        logger.error(
          `Meta should exist but does not for some reason - ${DestinationTag}, ${hash}`,
          { DestinationTag, hash, transaction, meta },
        )
        continue
      }
      const { delivered_amount } = meta

      const mainWallet = derivePrimaryWallet().classicAddress
      const isDestinationOurWallet = mainWallet === Destination
      if (!isDestinationOurWallet) {
        continue
      }

      if (!DestinationTag) {
        logger.info(
          'No destination tag - our wallet received funds from an unknown address with this transactionHash',
          { DestinationTag, hash, transaction, meta },
        )
        continue
      }

      const destinationTagDoc = await getRippleTag(DestinationTag)
      if (!destinationTagDoc) {
        continue
      }

      const user = await getUserById(destinationTagDoc.userId)
      if (!user) {
        continue
      }

      // if delivered_amount is a string then it must be in XRP (drops)
      const isAmountInDrops = typeof delivered_amount === 'string'
      if (!isAmountInDrops) {
        logger.info(
          `Received a transaction of an unrecognized currency: ${delivered_amount}`,
          { delivered_amount, DestinationTag, hash, transaction, meta },
        )
        continue
      }

      const depositId = createUniqueDepositId(
        `${destinationTagDoc.destinationTag}`,
        'ripple',
        hash,
      )
      const amountInXrp = dropsToXrp(delivered_amount)
      const depositAmountUSD = await convertXrpToUserBalance(
        parseFloat(amountInXrp),
      )
      if (depositAmountUSD < config.ripple.deposit.minDepositAmountUSD) {
        continue
      }

      const depositTransaction: RippleDeposit = {
        depositAmountUSD,
        user,
        recipientId: mainWallet,
        currency: 'usd',
        depositType: 'ripple',
        cryptoType: 'Ripple',
        depositId,
        externalId: hash,
        meta: {
          txHash: hash,
          toAddress: mainWallet,
        },
      }

      depositTransactionArr.push({
        deposit: depositTransaction,
        transaction,
      })
    }

    return {
      filteredTransactions: depositTransactionArr,
    }
  },
  onBlockCompletion: async message => {},
  onError: async ({ message, error }) => {
    cryptoLogger('ripple/inboundTransactions/onError', { userId: null }).error(
      `Ripple inboundTransaction hooks error - ${message}`,
      { message },
      error,
    )
  },
}
