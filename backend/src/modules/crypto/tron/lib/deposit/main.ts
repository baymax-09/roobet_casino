import type TronWeb from 'tronweb'

import { createUniqueDepositId } from 'src/modules/deposit/lib/util'
import { config } from 'src/system'
import { scopedLogger } from 'src/system/logger'
import { getUserById } from 'src/modules/user'
import { publishDepositMessage } from 'src/modules/deposit/rabbitmq/publish'
import { cryptoConversionMap } from 'src/modules/crypto/lib'

import {
  type TronDeposit,
  type Transaction,
  type TronAddressHex,
} from '../../types'
import { DepositError, type IOResult } from '../../../types'
import { getTronWalletByAddress, convertHexAddressToBase58 } from '../wallet'
import { getProvider } from '../../util/getProvider'
import { getValueData, isRecipientOurWallet } from './flatten'
import { createWalletBalance } from '../../documents/tron_balances'

interface FilterTransactionResult {
  deposit: TronDeposit
  transaction: Transaction
}

const tronLogger = scopedLogger('tron-lib-deposit')

export async function getTrxDeposit(
  tronWeb: TronWeb,
  transaction: Transaction,
  isTRC20FeatureAvailable: boolean,
): Promise<FilterTransactionResult | undefined> {
  const logger = tronLogger('getTrxDeposit', { userId: null })
  const { txID: id } = transaction

  const valueTime = Date.now()
  const valueData = await getValueData({
    tronWeb,
    transaction,
    isTRC20FeatureAvailable,
  })
  if (!valueData) {
    return
  }

  logger.info('valueData', {
    time: Date.now() - valueTime,
  })

  const walletLookupTime = Date.now()
  const { sender, recipient, rawAmount, cryptoType, depositType } = valueData

  const wallet = await getTronWalletByAddress(recipient)

  logger.info('walletLookup', {
    time: Date.now() - walletLookupTime,
  })

  if (!wallet) {
    return
  }

  const user = await getUserById(wallet.userId)
  if (!user) {
    return
  }

  const depositAmountUSD = await cryptoConversionMap[cryptoType](rawAmount)

  const recipientId = wallet.address
  if (depositAmountUSD < config.tron.deposit.minDepositAmountUSD) {
    return
  }

  const senderAddress = convertHexAddressToBase58(sender as TronAddressHex)
  const { isMainWalletSender, isPoolingWalletSender } = isRecipientOurWallet(
    senderAddress,
    recipient,
  )

  if (isMainWalletSender || isPoolingWalletSender) {
    // this transaction is from our main wallet or our pooling wallet funding a TRC20 transaction
    if (isMainWalletSender) {
      // a user has withdrawn to their own deposit address
      // we know this because the recipient is one of our user wallets

      // create a balance record because we need to pool this money, but we will not credit the user
      await createWalletBalance({
        token: 'trx',
        address: recipientId,
        actionRequired: 'pool',
        processing: false,
      })
    }

    return undefined
  }

  const depositId = createUniqueDepositId(recipientId, 'tron', id)
  const deposit: TronDeposit = {
    depositAmountUSD,
    depositId,
    depositType,
    recipientId,
    cryptoType,
    user,
    currency: 'usd',
    externalId: id,
    meta: {
      txHash: id,
      toAddress: recipient,
    },
  }

  return {
    deposit,
    transaction,
  }
}

export async function getTransactionAndReprocessDeposit(
  transactionHash: string,
): Promise<IOResult<{ transactionHash: string }, DepositError>> {
  const tronWeb = getProvider()
  const transaction = await tronWeb.trx.getTransaction(transactionHash)
  if (!transaction) {
    return {
      success: false,
      error: new DepositError('Transaction does not exist on the blockchain'),
      result: undefined,
    }
  }

  const depositPayload = await getTrxDeposit(tronWeb, transaction, false)
  if (!depositPayload) {
    return {
      success: false,
      error: new DepositError('Transaction is not a valid deposit'),
      result: undefined,
    }
  }

  await publishDepositMessage({ network: 'Tron', deposits: [depositPayload] })

  return {
    success: true,
    error: undefined,
    result: { transactionHash },
  }
}
