import numeral from 'numeral'

import { io } from 'src/system'
import { checkSystemEnabled } from 'src/modules/userSettings'
import { createNotification } from 'src/modules/messaging'
import { tuid } from 'src/util/i18n'
import { creditBalance } from 'src/modules/user/balance'
import { slackTransaction, slackTransactionHr } from 'src/vendors/slack'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'
import { recordReceivedTransfer } from 'src/vendors/chainalysis'
import { getCryptoUrl } from 'src/modules/crypto/lib'
import { CryptoToBalanceTypeMap as CryptoMap } from 'src/modules/crypto/types'
import { DepositHooks as TronDepositHooks } from 'src/modules/crypto/tron/hooks/depositQueue'
import { DepositHooks as RippleDepositHooks } from 'src/modules/crypto/ripple/hooks/depositQueue'

import { recordDepositTransaction } from '../lib/deposit'
import {
  DepositStatuses,
  ReasonCodes,
  requiredConfirmations,
} from '../lib/util'
import {
  type SupportedNetwork,
  type DepositQueueHooks,
  type GenericDepositHooks,
} from '../types'
import {
  cancelDepositTransaction,
  updateDepositTransaction,
  updateDepositTransactionStatus,
} from '../documents/deposit_transactions_mongo'
import { riskCheck } from '../lib/risk'
import { afterDepositHooks } from '../lib/hooks'
import { depositLogger } from '../lib/logger'

export const CryptoDepositHooks: Record<
  SupportedNetwork,
  DepositQueueHooks<any>
> = {
  Tron: TronDepositHooks,
  Ripple: RippleDepositHooks,
}

export const GenericDepositQueueHooks: GenericDepositHooks = {
  validationChecks: async depositPayload => {
    const isEnabled = await checkSystemEnabled(depositPayload.user, 'deposit')

    return isEnabled
  },
  startDeposit: async (depositPayload, network) => {
    const {
      depositId,
      user,
      depositType,
      externalId,
      meta,
      currency,
      depositAmountUSD: amount,
      forcedReprocess = false,
    } = depositPayload
    const requiredConfs = requiredConfirmations[depositType]

    const payload = {
      id: depositId,
      userId: user.id,
      depositType,
      network,
      amount,
      currency,
      externalId,
      confirmations: 0,
      meta,
    }

    const result = await recordDepositTransaction(payload)
    const stopCondition =
      result.alreadyExists &&
      result.deposit?.status === DepositStatuses.Completed &&
      !forcedReprocess
    if (stopCondition || !result.deposit) {
      depositLogger('depositQueue/startDeposit', { userId: user.id }).info(
        `DepositStopped - Deposit: ${result}, Reason: ${ReasonCodes.ALREADY_EXISTS.message}, alreadyExists: ${result.alreadyExists}`,
        {
          deposit: result,
          reason: ReasonCodes.ALREADY_EXISTS.message,
          alreadyExists: result.alreadyExists,
        },
      )
      return null
    }

    await createNotification(
      user.id,
      await tuid(user.id, 'deposit__received_waiting_confs', [
        `${requiredConfs}`,
      ]),
      'deposit',
      { amount },
    )

    return result.deposit._id
  },
  riskCheck: async depositPayload => {
    const {
      depositMongoId,
      user,
      depositType,
      externalId,
      recipientId,
      depositAmountUSD: amount,
    } = depositPayload

    // Final Fraud Check
    const receivedTransferResponse = await recordReceivedTransfer(
      user.id,
      externalId,
      recipientId,
      depositType,
    )
    const analysis = receivedTransferResponse?.analysis

    if (receivedTransferResponse?.isHighRisk) {
      await cancelDepositTransaction(
        depositMongoId,
        ReasonCodes.CHAINALYSIS_CHECK.message,
      )
      return false
    }

    const customFields = {
      cluster_name: analysis?.cluster?.name || '',
      cluster_category: analysis?.cluster?.category || '',
      rating: analysis?.rating || '',
    }

    depositLogger('depositQueue/riskCheck', { userId: user.id }).info(
      `Step 1.b - ${depositMongoId}`,
      { depositMongoId },
    )
    const risk = await riskCheck({
      amount,
      currency: 'usd',
      depositType,
      transactionId: depositMongoId.toString(),
      ip: '',
      session: { id: '', data: '' },
      user,
      customFields,
    })

    if (risk?.statusCode === ReasonCodes.SEON_CHECK.code) {
      await cancelDepositTransaction(
        depositMongoId,
        ReasonCodes.SEON_CHECK.message,
      )
      return false
    }

    return true
  },
  completeDeposit: async depositPayload => {
    const {
      user,
      depositAmountUSD,
      externalId,
      confirmations,
      depositMongoId: depositTransactionId,
      depositType,
    } = depositPayload
    const balanceType = CryptoMap[depositType]

    // Update confirmations before the idempotency check below.
    await updateDepositTransaction({
      _id: depositTransactionId,
      confirmations,
    })

    await updateDepositTransactionStatus(
      depositTransactionId,
      DepositStatuses.Completed,
    )

    await updateDepositTransaction({
      _id: depositTransactionId,
      meta: {
        confirmationsOnCompleted: confirmations,
      },
    })

    await creditBalance({
      user,
      amount: depositAmountUSD,
      transactionType: 'deposit',
      meta: {
        transactionId: externalId,
        depositId: depositTransactionId.toString(),
        confirmationsOnCredit: confirmations,
      },
      balanceTypeOverride: balanceType,
    })
  },
  postProcessingHooks: async depositPayload => {
    const {
      user,
      confirmations,
      depositMongoId: depositTransactionId,
      depositType,
      depositAmountUSD: amount,
      externalId,
    } = depositPayload
    const balanceType = CryptoMap[depositType]

    const firstTimeDeposit = user.hiddenTotalDeposits === 0
    const cryptoUrl = getCryptoUrl(depositType, externalId)
    const confirmationsString = confirmations

    slackTransaction(
      `*${user.name}* [${user.id}] deposited *${numeral(amount).format(
        '$0,0.00',
      )}* with ${depositType}. ${cryptoUrl}
      - [confirmations=${confirmationsString}]`,
    )
    if (amount >= 100) {
      slackTransactionHr(
        `*${user.name}* [${user.id}] deposited *${numeral(amount).format(
          '$0,0.00',
        )}* with ${depositType}. ${cryptoUrl}
        - [confirmations=${confirmationsString}]`,
      )
    }

    const convertedCredits = await exchangeAndFormatCurrency(amount, user)
    await createNotification(
      user.id,
      await tuid(user.id, 'crypto__deposit_confirmed', [`${convertedCredits}`]),
      'deposit',
      { amount, externalId, type: depositType },
    )

    await afterDepositHooks(user, amount, balanceType)

    io.to(user.id).emit('newDeposit', {
      transactionId: depositTransactionId,
      type: depositType,
      amount,
      firstTimeDeposit,
    })
  },
  onError: async ({ depositPayload, error }) => {
    depositLogger('depositQueue/onError', {
      userId: depositPayload.user.id,
    }).error('depositQueue hooks error', { depositPayload }, error)
  },
}
