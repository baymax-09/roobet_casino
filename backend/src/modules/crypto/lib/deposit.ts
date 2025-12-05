import { riskCheck, DepositStatuses, ReasonCodes } from 'src/modules/deposit'
import { creditBalance } from 'src/modules/user/balance'
import { recordReceivedTransfer } from 'src/vendors/chainalysis'
import { type User } from 'src/modules/user/types'
import { type ObjectId } from 'src/util/types/ids'
import {
  cancelDepositTransaction,
  updateDepositTransaction,
  updateDepositTransactionStatus,
} from 'src/modules/deposit/documents/deposit_transactions_mongo'

import {
  type IUserWallet,
  type CryptoLowercase,
  CryptoToBalanceTypeMap as CryptoMap,
} from '../types'
import { type BlockioWallet } from '../documents/blockio_wallets'
import { type EthereumWallet } from '../ethereum/types'
import { postDepositHooks } from './hooks'
import { cryptoLogger } from './logger'

interface CryptoDepositArgs {
  user: User
  wallet: IUserWallet | BlockioWallet | EthereumWallet
  depositId: ObjectId
  transactionId: string
  amount: number
  confirmations: number
  cryptoType: CryptoLowercase

  precredit?: boolean
  // only used for reprocessing deposits
  forcedReprocess?: boolean
}

export async function addCryptoDeposit({
  user,
  wallet,
  depositId: depositTransactionId,
  transactionId,
  amount,
  confirmations,
  cryptoType,
  precredit = false,
  forcedReprocess = false,
}: CryptoDepositArgs) {
  const logger = cryptoLogger('addCryptoDeposit', { userId: user.id })

  logger.info(`Step 1.a - ${depositTransactionId}`, {
    depositId: depositTransactionId,
  })
  const userCredits = amount
  const balanceType = CryptoMap[cryptoType]

  // Update confirmations before the idempotency check below.
  await updateDepositTransaction({
    _id: depositTransactionId,
    confirmations,
  })

  // Only update the status so we can use the mutated result as a idempotency check.
  const updateResult = await updateDepositTransactionStatus(
    depositTransactionId,
    DepositStatuses.Completed,
  )

  // Another process has reached deposit confirmation, to prevent race conditions
  // double crediting a user, simply return here.
  if (!updateResult.mutated && !forcedReprocess) {
    return
  }

  await updateDepositTransaction({
    _id: depositTransactionId,
    meta: {
      confirmationsOnCompleted: confirmations,
    },
  })

  const existingDeposit = updateResult.deposit

  if (!existingDeposit) {
    logger.error(
      `Crypto Deposit - Somehow we got this far without creating a deposit record for ${user.id} for ${transactionId}`,
      {
        user,
        transactionId,
        userCredits,
        balanceType,
        depositId: depositTransactionId,
      },
    )
    return
  }

  const receivedTransferResponse = await recordReceivedTransfer(
    user.id,
    transactionId,
    wallet.address,
    cryptoType,
  )
  const analysis = receivedTransferResponse?.analysis

  if (receivedTransferResponse?.isHighRisk) {
    await cancelDepositTransaction(
      depositTransactionId,
      ReasonCodes.CHAINALYSIS_CHECK.message,
    )
    return
  }

  const customFields = {
    cluster_name: analysis?.cluster?.name || '',
    cluster_category: analysis?.cluster?.category || '',
    rating: analysis?.rating || '',
  }

  logger.info(`Step 1.b - ${depositTransactionId}`, {
    user,
    transactionId,
    userCredits,
    balanceType,
    depositId: depositTransactionId,
  })
  const risk = await riskCheck({
    amount: userCredits,
    currency: 'usd',
    depositType: existingDeposit.depositType,
    transactionId: depositTransactionId.toString(),
    ip: '',
    session: { id: '', data: '' },
    user,
    customFields,
  })

  if (risk?.statusCode === ReasonCodes.SEON_CHECK.code) {
    await cancelDepositTransaction(
      depositTransactionId,
      ReasonCodes.SEON_CHECK.message,
    )
    return
  }

  await creditBalance({
    user,
    amount: userCredits,
    transactionType: 'deposit',
    meta: {
      transactionId,
      depositId: depositTransactionId.toString(),
      confirmationsOnCredit: confirmations,
    },
    balanceTypeOverride: balanceType,
  })

  await postDepositHooks({
    user,
    wallet,
    confirmations,
    precredit,
    transactionId,
    cryptoType,
    userCredits,
    depositTransactionId: depositTransactionId.toString(),
    balanceType,
    existingDeposit,
  })
}
