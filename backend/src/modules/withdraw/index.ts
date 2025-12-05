import { config } from 'src/system'
import { type BalanceType, type User } from 'src/modules/user/types'
import {
  creditBalance,
  deductFromBalance,
  validateAndGetBalanceType,
} from '../user/balance'
import { APIValidationError } from 'src/util/errors'

import {
  PluginToCryptoNetwork,
  type CryptoWithdrawal,
  type Plugin,
  type WithdrawalRequest,
} from './types'
import { WithdrawStatusEnum } from './types'
import { validateWithdrawal } from './lib/validate'
import { postWithdrawalHooks } from './lib/hooks'
import { buildWithdrawal, createWithdraw } from './lib/initiate'
import { getPlugin, PluginMap } from './lib/plugins'
import { checkForRisk } from './lib/risk'
import {
  updatePendingWithdrawalStatus,
  updateWithdrawal,
  updateWithdrawalStatus,
} from './documents/withdrawals_mongo'
import { FailureReasonCodes } from './lib/util'
import { slackHighAlert } from 'src/vendors/slack'
import { withdrawLogger } from './lib/logger'

export * as Routes from './routes'
export * as Workers from './workers'
export * as Documents from './documents'
export * as Types from './types'

interface WithdrawProcessArgs {
  user: User
  request: WithdrawalRequest
  balanceTypeOverride: BalanceType | null
  session: { id: string; data: string }
}

interface WithdrawProcessResult {
  status: WithdrawStatusEnum
  externalId?: string
}

const withdrawAttemptLimit = 5

interface FlagWithdrawalArgs {
  withdrawalId: string
  userName: string
  userId: string
  amount: number
}

const flagWithdrawal = async ({
  withdrawalId,
  userId,
  userName,
  amount,
}: FlagWithdrawalArgs): Promise<void> => {
  // Mark record as flagged.
  await updateWithdrawalStatus(withdrawalId, WithdrawStatusEnum.FLAGGED)

  // Send slack message.
  const formattedAmount = amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
  const message = `A withdrawal of ${formattedAmount} by ${userName} - ${userId} has been flagged by SEON and is awaiting approval.`
  slackHighAlert(message)
}

/** This should only be used for Crypto -- NOT Cash */
export async function withdrawalProcess(
  args: WithdrawProcessArgs,
): Promise<WithdrawProcessResult> {
  const {
    user,
    request,
    balanceTypeOverride: rawBalanceTypeOverride,
    session,
  } = args

  // TODO temporary and will be removed when TRC20 is released
  const network = PluginToCryptoNetwork[request.plugin]

  const logger = withdrawLogger('withdrawalProcess', { userId: user.id })
  const response: WithdrawProcessResult = {
    status: WithdrawStatusEnum.INITIATED,
  }
  const balanceTypeOverride = validateAndGetBalanceType({
    balanceIdentifier: rawBalanceTypeOverride || null,
  })
  const rawWithdrawalRequest: WithdrawalRequest = await buildWithdrawal(request)

  const plugin: Plugin = getPlugin(rawWithdrawalRequest.plugin)

  const balanceType = PluginMap[rawWithdrawalRequest.plugin]

  // Validate withdraw request.
  await validateWithdrawal(user, rawWithdrawalRequest, balanceType)
  const updatedWithdrawalRequest = await plugin.validate(
    user,
    rawWithdrawalRequest,
    network,
  )

  // Create the withdraw record.
  const withdrawalId = await createWithdraw(user, updatedWithdrawalRequest)
  const payload = { ...updatedWithdrawalRequest, id: withdrawalId }

  const riskCheck = await checkForRisk({
    user,
    withdrawal: payload,
    session,
  })

  // If tx is declined, update status and return message to user.
  if (riskCheck.isDeclined) {
    await updateWithdrawalStatus(
      withdrawalId,
      WithdrawStatusEnum.FAILED,
      FailureReasonCodes[riskCheck.reason ?? 'RISK_CHECK'].message,
    )

    throw new APIValidationError(riskCheck.message ?? 'fraud__check_reject')
  }

  // Take balance from user.
  try {
    await deductFromBalance({
      user,
      amount: updatedWithdrawalRequest.totalValue,
      transactionType: 'withdrawal',
      meta: {},
      balanceTypeOverride,
    })
  } catch (error) {
    logger.error(
      `Failed to take balance from user ${user.id} and withdrawal ${withdrawalId}`,
      {
        amount: updatedWithdrawalRequest.totalValue,
        transactionType: 'withdrawal',
        balanceTypeOverride,
        withdrawalId,
      },
      error,
    )
    await updateWithdrawalStatus(
      withdrawalId,
      WithdrawStatusEnum.FAILED,
      FailureReasonCodes.DEDUCT_BALANCE.message,
    )
    throw error
  }

  // If flagged, update status and continue.
  if (riskCheck.isFlagged) {
    await flagWithdrawal({
      userId: user.id,
      userName: user.name,
      amount: updatedWithdrawalRequest.totalValue,
      withdrawalId,
    })
  }

  // Only send the WD if the tx isn't flagged.
  if (!riskCheck.isFlagged) {
    try {
      const { status, externalId } = await plugin.send(user, payload)
      response.status = status
      response.externalId = externalId
    } catch (error) {
      logger.error(
        `Failed plugin send and status update for user ${user.id} and withdrawal ${withdrawalId}`,
        { withdrawalId, amount: updatedWithdrawalRequest.totalValue },
        error,
      )

      await updateWithdrawalStatus(
        withdrawalId,
        WithdrawStatusEnum.FAILED,
        FailureReasonCodes.PLUGIN_UNKNOWN_FAILURE.message,
      )

      await creditBalance({
        user,
        amount: updatedWithdrawalRequest.totalValue,
        meta: {},
        transactionType: 'cancelledWithdrawal',
        balanceTypeOverride,
      })

      throw error
    }
  }

  // Run hooks for all non-failed WDs.
  try {
    await postWithdrawalHooks(user, updatedWithdrawalRequest)
  } catch (error) {
    logger.error(
      `postWithdrawalHooks failed for userId ${user.id} and withdrawalId ${withdrawalId}`,
      {
        withdrawalId,
        transactionType: 'cancelledWithdrawal',
        amount: updatedWithdrawalRequest.totalValue,
      },
      error,
    )
  }
  return response
}

export async function backgroundWithdrawalProcess(
  user: User,
  withdrawal: CryptoWithdrawal,
) {
  const attempts = withdrawal.attempts || 0
  const plugin = getPlugin(withdrawal.plugin)
  const { request } = withdrawal

  // TODO temporary and will be removed when TRC20 is released
  const network = PluginToCryptoNetwork[request.plugin]

  // Only update the WD status if it's in a pending status.
  const updatedRecord = await updatePendingWithdrawalStatus(
    withdrawal.id,
    WithdrawStatusEnum.PROCESSING,
  )

  // If the pending WD was not found, early return.
  if (!updatedRecord) {
    return
  }

  try {
    await plugin.sendBackground(user, withdrawal, network)
  } catch (err) {
    // backoff every X attempts
    const isFirstAttempt = attempts === 0
    const attemptCondition =
      isFirstAttempt || attempts % withdrawAttemptLimit !== 0
    if (attemptCondition) {
      await updateWithdrawal(withdrawal.id, {
        // TODO should be atomic with $inc
        attempts: attempts + 1,
        status: WithdrawStatusEnum.PENDING,
      })
    } else {
      const status = WithdrawStatusEnum.REPROCESSING
      withdrawLogger('backgroundWithdrawalProcess', { userId: user.id }).info(
        `Withdrawal ${withdrawal.id} is backing off after failing multiple times.`,
        {
          withdrawal,
        },
      )
      // TODO should be atomic with $inc
      await updateWithdrawal(withdrawal.id, { attempts: attempts + 1, status })
    }
    throw err
  }
}

/** Cash to Crypto withdrawals */
export async function withdrawalTransferProcess(
  args: WithdrawProcessArgs,
): Promise<WithdrawProcessResult> {
  const { user, request, session } = args

  // TODO temporary and will be removed when TRC20 is released
  const network = PluginToCryptoNetwork[request.plugin]

  const logger = withdrawLogger('withdrawalTransferProcess', {
    userId: user.id,
  })
  const response: WithdrawProcessResult = {
    status: WithdrawStatusEnum.INITIATED,
  }
  const withdrawal: WithdrawalRequest = await buildWithdrawal({
    ...request,
    sourceBalanceType: 'cash',
  })

  const plugin: Plugin = getPlugin(withdrawal.plugin)

  // validate withdraw request for cash
  await validateWithdrawal(user, withdrawal, 'cash')

  if (!user.twofactorEnabled) {
    throw new APIValidationError('withdraw__2fa_required')
  }

  const minWithdraw = config.paymentiq.minWithdraw
  const maxWithdraw = config.paymentiq.maxWithdraw

  if (withdrawal.totalValue < minWithdraw) {
    throw new APIValidationError('withdrawal__min_cash_plugin', [
      `$${minWithdraw}`,
    ])
  }

  if (withdrawal.totalValue > maxWithdraw) {
    throw new APIValidationError('withdrawal__max_cash_plugin', [
      `$${maxWithdraw}`,
    ])
  }

  // Ensure KYC level is > 1.
  if (!user.kycLevel || user.kycLevel < 2) {
    throw new APIValidationError('kyc__cash_withdraw', ['2'])
  }

  // Validate the crypto side of things.
  await plugin.validate(user, withdrawal, network)

  // Create the withdraw record.
  const withdrawalId = await createWithdraw(user, withdrawal)
  const customFields = {
    cash_transfer: true,
    cash_transfer_amount: withdrawal.totalValue,
  }

  const riskCheck = await checkForRisk({
    user,
    withdrawal: { ...withdrawal, id: withdrawalId },
    session,
    customFields,
  })

  // If decline, fail the WD and return message to user.
  if (riskCheck.isDeclined) {
    await updateWithdrawalStatus(
      withdrawalId,
      WithdrawStatusEnum.FAILED,
      FailureReasonCodes[riskCheck.reason ?? 'RISK_CHECK'].message,
    )

    throw new APIValidationError(riskCheck.message ?? 'fraud__check_reject')
  }

  // Take balance from user.
  try {
    await deductFromBalance({
      user,
      amount: withdrawal.totalValue,
      transactionType: 'withdrawal',
      meta: {},
      balanceTypeOverride: 'cash',
    })
  } catch (error) {
    logger.error(
      `Failed to take balance from user ${user.id} and withdrawal ${withdrawalId}`,
      { withdrawalId, amount: withdrawal.totalValue, riskCheck },
      error,
    )
    await updateWithdrawalStatus(
      withdrawalId,
      WithdrawStatusEnum.FAILED,
      FailureReasonCodes.DEDUCT_BALANCE.message,
    )
    throw error
  }

  // If flagged, update status and continue.
  if (riskCheck.isFlagged) {
    await flagWithdrawal({
      userId: user.id,
      userName: user.name,
      amount: withdrawal.totalValue,
      withdrawalId,
    })
  }

  // Only send the WD if the tx isn't flagged.
  if (!riskCheck.isFlagged) {
    try {
      const { status, externalId } = await plugin.send(user, {
        ...withdrawal,
        id: withdrawalId,
      })

      response.status = status
      response.externalId = externalId
    } catch (error) {
      logger.error(
        `Failed plugin send and status update for user ${user.id} and withdrawal ${withdrawalId}`,
        { withdrawalId, amount: withdrawal.totalValue, riskCheck },
        error,
      )

      await updateWithdrawalStatus(
        withdrawalId,
        WithdrawStatusEnum.FAILED,
        FailureReasonCodes.TRANSACTION_FAILED.message,
      )

      await creditBalance({
        user,
        amount: withdrawal.totalValue,
        meta: {},
        transactionType: 'cancelledWithdrawal',
        balanceTypeOverride: 'cash',
      })

      throw error
    }
  }

  // Run hooks for all non-failed WDs.
  try {
    await postWithdrawalHooks(user, withdrawal)
  } catch (error) {
    logger.error(
      `postWithdrawalHooks failed for userId ${user.id} and withdrawalId ${withdrawalId}`,
      { withdrawalId, amount: withdrawal.totalValue, riskCheck },
      error,
    )
  }
  return response
}
