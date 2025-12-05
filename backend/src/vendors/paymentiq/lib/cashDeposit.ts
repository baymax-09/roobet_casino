import numeral from 'numeral'

import { io } from 'src/system'
import { slackTransaction, slackTransactionHr } from 'src/vendors/slack'
import { getUserById } from 'src/modules/user'
import { checkSystemEnabled } from 'src/modules/userSettings'
import {
  afterDepositHooks,
  notifyOnUpdate,
} from 'src/modules/deposit/lib/hooks'
import { DepositStatuses, ReasonCodes, riskCheck } from 'src/modules/deposit'
import { feedbackForCashTransaction } from 'src/modules/fraud/riskAssessment'
import { creditBalance } from 'src/modules/user/balance'

import {
  createCashDepositTransaction,
  getCashDepositTransactionByExternalId,
  updateCashDepositTransaction,
  updateCashDepositTransactionByExternalId,
} from '../documents/cash_deposit_transactions'
import { errorMap } from '../constants'
import {
  generateUnsuccessfulResponse,
  getDefaultAuthorizeAndTransferResponse,
  txAmountToNumber,
  buildUpdatedUserFields,
} from './util'
import {
  type AuthorizeRequest,
  type AuthorizeResponse,
  type CancelRequest,
  type CancelResponse,
  type TransferResponse,
  type TransferRequest,
} from '../types'
import { validateAuthorizeRequestForUser } from './validate'
import { piqLogger } from './logger'

const DEPOSIT_TYPE = 'paymentIq'
const DEFAULT_PSP_STATUS_MESSAGE = 'Success'

/**
 * Invoked by /paymentIq/authorize webhook:
 * 1. Validate User
 * 2. Create DepositTransaction record
 * 3. Run Risk Check
 * 4. Update DepositTransaction record
 * 5. Notify User
 * 6. Return AuthorizeResponse
 *
 * @param {AuthorizeRequest}
 * @returns {AuthorizeResponse}
 */
export async function startCashDeposit(
  request: AuthorizeRequest,
): Promise<AuthorizeResponse> {
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
      error: errorMap.DEPOSIT_USER_NOT_FOUND,
    })
  }

  const isEnabled = await checkSystemEnabled(user, 'deposit')

  if (!isEnabled) {
    return generateUnsuccessfulResponse({
      userId,
      externalId,
      error: errorMap.DEPOSIT_USER_SYSTEM_DISABLED,
    })
  }

  const validateError = await validateAuthorizeRequestForUser({
    type: 'deposit',
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

  const createResult = await createCashDepositTransaction({
    amount,
    currency,
    externalId,
    originTxId: '',
    paymentMethod: txName,
    provider,
    reason: '',
    status: DepositStatuses.Initiated,
    userId: user.id,
  })

  const depositId = createResult._id.toString()
  const balanceAfterTransaction = user.cashBalance + amount

  try {
    await riskCheck({
      amount,
      currency: 'usd',
      transactionId: depositId,
      depositType: DEPOSIT_TYPE,
      ip: '',
      session: { data: '', id: '' },
      user,
      customFields: {
        card_hash: maskedAccount,
        card_holder: attributes?.cardHolder,
        cash_provider: provider,
        card_bin: attributes?.cardBin,
        card_expiry: attributes?.cardExpiry,
        account_holder: accountHolder,
        cash_payment_method: txName,
        national_id: attributes?.nationalId || undefined,
        psp3ds: attributes?.pspAccount,
        cashBalance: balanceAfterTransaction,
      },
    })
  } catch (err) {
    await updateCashDepositTransaction(depositId, {
      status: DepositStatuses.Failed,
      reason: ReasonCodes.SEON_CHECK.message,
    })
    piqLogger('startCashDeposit', { userId: user.id }).error(
      `Deposit has Failed Risk check`,
      { depositId },
      err,
    )
    return generateUnsuccessfulResponse({
      userId,
      merchantTxId: depositId,
      externalId,
      error: errorMap.DEPOSIT_RISK_CHECK_FAILED,
    })
  }

  await updateCashDepositTransaction(depositId, {
    status: DepositStatuses.Pending,
  })

  await notifyOnUpdate({
    user,
    amount,
    status: DepositStatuses.Pending,
    transactionId: externalId,
    type: DEPOSIT_TYPE,
  })

  const response = {
    ...getDefaultAuthorizeAndTransferResponse(userId),
    merchantTxId: depositId,
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
 * 1. Update DepositTransaction record
 * 2. Credit User
 * 3. Notify Slack
 * 4. Update Stat
 * 4. Return TransferResponse
 *
 * @param {TransferRequest}
 * @returns {TransferResponse}
 */
export async function completeCashDeposit({
  userId,
  txId: externalId,
  pspStatusMessage = DEFAULT_PSP_STATUS_MESSAGE,
  attributes,
}: TransferRequest): Promise<TransferResponse> {
  const user = await getUserById(userId)

  if (!user) {
    return generateUnsuccessfulResponse({
      userId,
      externalId,
      error: errorMap.DEPOSIT_USER_NOT_FOUND,
    })
  }

  const deposit = await getCashDepositTransactionByExternalId(externalId)

  if (!deposit) {
    return generateUnsuccessfulResponse({
      userId,
      externalId,
      error: errorMap.DEPOSIT_TRANSACTION_NOT_FOUND,
    })
  }

  const depositId = deposit._id.toString()

  if (deposit.status === DepositStatuses.Completed) {
    piqLogger('completeCashDeposit', { userId: user.id }).error(
      'Deposit is already completed',
      { depositId },
    )
    return generateUnsuccessfulResponse({
      userId,
      externalId,
      error: errorMap.DEPOSIT_STATUS_ALREADY_COMPLETED,
    })
  }

  await updateCashDepositTransaction(depositId, {
    status: DepositStatuses.Completed,
    providerResponse: { pspStatusMessage, info: attributes?.info ?? '' },
  })

  const firstTimeDeposit = user.hiddenTotalDeposits === 0
  const userCredits = deposit.amount
  const balanceType = 'cash'
  await creditBalance({
    user,
    amount: userCredits,
    transactionType: 'deposit',
    meta: { depositId },
    balanceTypeOverride: balanceType,
  })

  slackTransaction(
    `*${user.name}* [${user.id}] deposited *${numeral(userCredits).format(
      '$0,0.00',
    )}* with ${balanceType}`,
  )
  if (userCredits >= 100) {
    slackTransactionHr(
      `*${user.name}* [${user.id}] deposited *${numeral(userCredits).format(
        '$0,0.00',
      )}* with ${balanceType}`,
    )
  }

  await feedbackForCashTransaction(depositId, 'completed')
  await afterDepositHooks(user, deposit.amount, balanceType)

  io.to(user.id).emit('newDeposit', {
    transactionId: deposit.externalId,
    type: balanceType,
    amount: userCredits,
    firstTimeDeposit,
  })

  await notifyOnUpdate({
    user,
    amount: userCredits,
    status: DepositStatuses.Completed,
    transactionId: externalId,
    type: DEPOSIT_TYPE,
  })

  return {
    ...getDefaultAuthorizeAndTransferResponse(userId),
    success: true,
    merchantTxId: depositId,
    txId: externalId,
  }
}

/**
 * Invoked by /paymentIq/cancel webhook:
 * 1. Update DepositTransaction record
 * 2. Send feedback to Seon
 * 3. Notify User
 * 4. Return CancelResponse
 *
 * @param {CancelRequest}
 * @returns {CancelResponse}
 */
export async function cancelCashDeposit({
  txId,
  userId,
  statusCode,
  pspStatusCode,
  pspStatusMessage = DEFAULT_PSP_STATUS_MESSAGE,
  txAmount,
  attributes,
}: CancelRequest): Promise<CancelResponse> {
  piqLogger('cancelCashDeposit', { userId }).info(
    'Deposit declined on cancel webhook',
    { txId },
  )

  const reason = statusCode || ''

  const status = DepositStatuses.Declined

  const updatedDeposit = await updateCashDepositTransactionByExternalId(txId, {
    status,
    reason,
    providerResponse: {
      statusCode,
      pspStatusCode,
      pspStatusMessage,
      info: attributes?.info ?? '',
    },
  })
  const user = await getUserById(userId)

  if (!updatedDeposit || !user) {
    return generateUnsuccessfulResponse({
      userId,
      externalId: txId,
      error: errorMap.DEPOSIT_TRANSACTION_NOT_FOUND,
    })
  }

  const depositId = updatedDeposit._id.toString()
  await feedbackForCashTransaction(depositId, 'cancelled')

  const amount = txAmountToNumber(txAmount)

  await notifyOnUpdate({
    user,
    amount,
    status,
    transactionId: txId,
    type: DEPOSIT_TYPE,
  })

  return {
    userId,
    success: true,
  }
}
