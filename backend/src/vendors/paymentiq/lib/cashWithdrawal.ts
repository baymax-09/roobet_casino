import numeral from 'numeral'

import { checkSystemEnabled } from 'src/modules/userSettings'
import {
  getUserById,
  updateTotalWithdrawn,
  decrementMaxWithdraw,
} from 'src/modules/user'
import { notifyOnUpdate } from 'src/modules/withdraw/lib/hooks'
import { checkForRisk } from 'src/modules/withdraw/lib/risk'
import { validateWithdrawalForCash } from 'src/modules/withdraw/lib/validate'
import {
  type CashWithdrawalRequest,
  WithdrawStatusEnum,
} from 'src/modules/withdraw/types'
import { slackTransaction, slackTransactionHr } from 'src/vendors/slack'
import { feedbackForCashTransaction } from 'src/modules/fraud/riskAssessment'
import {
  createCashWithdrawalTransaction,
  updateCashWithdrawalTransaction,
  updateCashWithdrawalTransactionByExternalId,
} from '../documents/cash_withdrawal_transactions'

import {
  type AuthorizeRequest,
  type AuthorizeResponse,
  type CancelRequest,
  type CancelResponse,
  type TransferRequest,
  type TransferResponse,
} from '../types'
import {
  generateUnsuccessfulResponse,
  getDefaultAuthorizeAndTransferResponse,
  txAmountToNumber,
  buildUpdatedUserFields,
  mapAPIErrorsToPIQErrors,
} from './util'
import { errorMap } from '../constants'
import { creditBalance, deductFromBalance } from 'src/modules/user/balance'
import { validateAuthorizeRequestForUser } from './validate'
import { FailureReasonCodes } from 'src/modules/withdraw/lib/util'
import { piqLogger } from './logger'

const WITHDRAWAL_TYPE = 'paymentIq'
const DEFAULT_PSP_STATUS_MESSAGE = 'Success'

/**
 * Invoked by /paymentIq/authorize webhook:
 * 1. Validate User
 * 2. Create a WithdrawalTransaction record
 * 3. Run Risk Check
 * 4. Take Balance from User
 * 5. Update WithdrawalTransaction record
 * 6. Notify User
 * 7. Return AuthorizeResponse
 *
 * @param {AuthorizeRequest}
 * @returns {AuthorizeResponse}
 */
export async function startCashWithdrawal(
  request: AuthorizeRequest,
): Promise<AuthorizeResponse> {
  const logger = piqLogger('startCashWithdrawal', { userId: request.userId })
  const {
    provider,
    txAmount,
    txAmountCy: currency,
    txId: externalId,
    txName,
    userId,
    maskedAccount,
    accountHolder,
    attributes,
  } = request

  const user = await getUserById(userId)

  if (!user) {
    return generateUnsuccessfulResponse({
      userId,
      externalId,
      error: errorMap.WITHDRAWAL_USER_NOT_FOUND,
    })
  }

  if (!user.twofactorEnabled) {
    return generateUnsuccessfulResponse({
      userId,
      externalId,
      error: errorMap.WITHDRAWAL_TWO_FACTOR_DISABLED,
    })
  }

  const isEnabled = await checkSystemEnabled(user, 'withdraw')

  if (!isEnabled) {
    return generateUnsuccessfulResponse({
      userId,
      externalId,
      error: errorMap.WITHDRAWAL_USER_SYSTEM_DISABLED,
    })
  }

  const validateError = await validateAuthorizeRequestForUser({
    type: 'withdrawal',
    request,
    user,
  })

  if (validateError) {
    return generateUnsuccessfulResponse({
      userId,
      externalId,
      error: validateError,
    })
  }

  const amount = txAmountToNumber(txAmount)

  try {
    await validateWithdrawalForCash(user, amount)
  } catch (error) {
    const piqError = mapAPIErrorsToPIQErrors(error)
    return generateUnsuccessfulResponse({
      userId,
      externalId,
      error: piqError,
    })
  }

  const withdrawal = await createCashWithdrawalTransaction({
    amount,
    currency,
    externalId,
    originTxId: '',
    paymentMethod: txName,
    provider,
    reason: '',
    status: WithdrawStatusEnum.INITIATED,
    userId: user.id,
  })
  const withdrawalId = withdrawal._id.toString()

  const withdrawalToRiskCheck: CashWithdrawalRequest & { id: string } = {
    ...withdrawal,
    id: withdrawalId,
    fields: {},
    plugin: 'paymentIq',
    totalValue: amount,
  }
  const balanceAfterTransaction = user.cashBalance - amount
  const riskCheck = await checkForRisk({
    user,
    withdrawal: withdrawalToRiskCheck,
    session: { id: '', data: '' },
    customFields: {
      card_hash: maskedAccount,
      account_holder: accountHolder,
      card_bin: attributes?.cardBin,
      card_expiry: attributes?.cardExpiry,
      card_holder: attributes?.cardHolder,
      cash_provider: provider,
      cash_payment_method: txName,
      national_id: attributes?.nationalId || undefined,
      cashBalance: balanceAfterTransaction,
    },
  })

  if (riskCheck.isDeclined) {
    await updateCashWithdrawalTransaction(withdrawalId, {
      status: WithdrawStatusEnum.FAILED,
      reason: errorMap.WITHDRAWAL_RISK_CHECK_FAILED.errMsg,
    })
    logger.error('Withdrawal failed RiskCheck', { withdrawalId })
    return generateUnsuccessfulResponse({
      userId,
      merchantTxId: withdrawalId,
      externalId,
      error: errorMap.WITHDRAWAL_RISK_CHECK_FAILED,
    })
  }

  try {
    await deductFromBalance({
      user,
      amount: withdrawal.amount,
      transactionType: 'withdrawal',
      meta: {},
      balanceTypeOverride: 'cash',
    })
  } catch (error) {
    logger.error('Failed to deduct balance', { withdrawalId }, error)
    await updateCashWithdrawalTransaction(withdrawalId, {
      status: WithdrawStatusEnum.FAILED,
      reason: FailureReasonCodes.DEDUCT_BALANCE.message,
    })

    return generateUnsuccessfulResponse({
      userId,
      merchantTxId: withdrawalId,
      externalId,
      error: errorMap.UNEXPECTED_WITHDRAWAL_ERROR,
    })
  }

  try {
    await updateCashWithdrawalTransaction(withdrawalId, {
      status: WithdrawStatusEnum.PENDING,
    })
  } catch (err) {
    logger.error(
      `Failed to update transaction record to ${WithdrawStatusEnum.PENDING}`,
      { withdrawalId },
      err,
    )
  }

  await notifyOnUpdate({
    status: WithdrawStatusEnum.PENDING,
    totalValue: amount,
    transactionId: externalId,
    type: WITHDRAWAL_TYPE,
    user,
  })

  const response = {
    ...getDefaultAuthorizeAndTransferResponse(userId),
    merchantTxId: withdrawalId,
    success: true,
  }

  const updatedUser = await buildUpdatedUserFields(user, provider)

  return {
    ...response,
    updatedUser,
  }
}

/**
 * Invoked by /paymentIq/transfer webhook:
 * 1. Update WithdrawalTransaction record
 * 2. Notify Slack
 * 3. Update Stats
 * 4. Return TransferResponse
 *
 * @param {TransferRequest}
 * @returns {TransferResponse}
 */
export async function completeCashWithdrawal({
  userId,
  txId: externalId,
  txAmount,
  pspStatusMessage = DEFAULT_PSP_STATUS_MESSAGE,
  attributes,
}: TransferRequest): Promise<TransferResponse> {
  const user = await getUserById(userId)

  if (!user) {
    return generateUnsuccessfulResponse({
      userId,
      externalId,
      error: errorMap.WITHDRAWAL_USER_NOT_FOUND,
    })
  }

  let withdrawalId
  try {
    const updatedWithdrawal = await updateCashWithdrawalTransactionByExternalId(
      externalId,
      {
        status: WithdrawStatusEnum.COMPLETED,
        providerResponse: { pspStatusMessage, info: attributes?.info ?? '' },
      },
    )

    if (!updatedWithdrawal) {
      return generateUnsuccessfulResponse({
        userId,
        externalId,
        error: errorMap.WITHDRAWAL_USER_NOT_FOUND,
      })
    }

    withdrawalId = updatedWithdrawal?._id.toString()
  } catch (err) {
    piqLogger('completeCashWithdrawal', { userId: user.id }).error(
      'Withdrawal was not found',
      { withdrawalId },
      err,
    )
  }

  const userCredits = txAmountToNumber(txAmount)

  slackTransaction(
    `*${user.name}* [${user.id}] withdrew *${numeral(userCredits).format(
      '$0,0.00',
    )}* with cash`,
  )
  if (userCredits >= 100) {
    slackTransactionHr(
      `*${user.name}* [${user.id}] withdrew *${numeral(userCredits).format(
        '$0,0.00',
      )}* with cash`,
    )
  }
  await feedbackForCashTransaction(withdrawalId, 'completed')
  await updateTotalWithdrawn(user.id, userCredits)
  await decrementMaxWithdraw(user.id, userCredits)

  await notifyOnUpdate({
    user,
    totalValue: userCredits,
    status: WithdrawStatusEnum.COMPLETED,
    transactionId: externalId,
    type: WITHDRAWAL_TYPE,
  })

  return {
    ...getDefaultAuthorizeAndTransferResponse(userId),
    success: true,
    merchantTxId: withdrawalId,
    txId: externalId,
  }
}

/**
 * Invoked by /paymentIq/cancel webhook:
 * 1. Update WithdrawalTransaction record
 * 2. Refund User
 * 3. Send feedback to Seon
 * 4. Notify User
 * 5. Return CancelResponse
 *
 * @param {CancelRequest}
 * @returns {CancelResponse}
 */
export async function cancelCashWithdrawal({
  txId,
  userId,
  statusCode,
  pspStatusCode,
  pspStatusMessage = DEFAULT_PSP_STATUS_MESSAGE,
  txAmount,
  attributes,
}: CancelRequest): Promise<CancelResponse> {
  piqLogger('cancelCashWithdrawal', { userId }).info(
    'Withdrawal declined on cancel webhook',
    { txId },
  )

  const reason = statusCode || ''

  const updatedWithdraw = await updateCashWithdrawalTransactionByExternalId(
    txId,
    {
      status: WithdrawStatusEnum.DECLINED,
      reason,
      providerResponse: {
        statusCode,
        pspStatusCode,
        pspStatusMessage,
        info: attributes?.info ?? '',
      },
    },
  )
  const user = await getUserById(userId)

  if (!updatedWithdraw || !user) {
    return generateUnsuccessfulResponse({
      userId,
      externalId: txId,
      error: errorMap.WITHDRAWAL_TRANSACTION_NOT_FOUND,
    })
  }

  const withdrawalId = updatedWithdraw._id.toString()
  const amount = txAmountToNumber(txAmount)
  await creditBalance({
    user,
    amount,
    meta: {},
    transactionType: 'declinedWithdrawal',
    balanceTypeOverride: 'cash',
  })

  await feedbackForCashTransaction(withdrawalId, 'cancelled')

  await notifyOnUpdate({
    user,
    totalValue: amount,
    status: WithdrawStatusEnum.DECLINED,
    transactionId: txId,
    type: WITHDRAWAL_TYPE,
  })

  return {
    userId,
    success: true,
  }
}
