import { type Types as UserTypes } from 'src/modules/user'
import {
  checkSystemEnabled,
  changeSystemEnabledUser,
} from 'src/modules/userSettings'
import { userIsLocked } from 'src/modules/user/lib/lock'
import { assessRisk, RiskStatus } from 'src/modules/fraud/riskAssessment'
import { CurrencyTypeMap } from 'src/modules/currency/types'
import { addNoteToUser } from 'src/modules/admin/documents/user_notes'
import { withdrawPreScreen } from 'src/vendors/chainalysis'
import { type Types } from 'src/modules/withdraw'
import { PluginToCurrencyMap } from './plugins'
import { isCryptoSymbol } from 'src/modules/crypto/types'

import { type FailureReasonCodes } from './util'
import { withdrawLogger } from './logger'

type RiskWithdrawal = (
  | Types.WithdrawalRequest
  | Types.CashWithdrawalRequest
) & { id: string }
interface RiskArgs {
  user: UserTypes.User
  withdrawal: RiskWithdrawal
  session: { id: string; data: string }
  customFields?: object
}

export type RiskCheckResponse =
  | {
      isDeclined: false
      isFlagged?: undefined
    }
  | {
      isDeclined: true
      reason: keyof typeof FailureReasonCodes
      message?: string
    }
  | {
      isDeclined?: undefined
      isFlagged: true
    }

export async function lockDownUser(
  userId: string,
  lockBets = false,
): Promise<boolean> {
  await changeSystemEnabledUser(userId, 'withdraw', false)
  await changeSystemEnabledUser(userId, 'tip', false)
  if (lockBets) {
    await changeSystemEnabledUser(userId, 'bets', false)
  }
  await addNoteToUser(
    userId,
    { id: 'risk', name: 'riskCheck', department: 'Compliance' },
    'Risk Check tripped on withdrawal attempt. Withdrawals/Tips disabled.',
  )
  return true
}

export async function checkForRisk({
  user,
  withdrawal,
  session,
  customFields = {},
}: RiskArgs): Promise<RiskCheckResponse> {
  try {
    const { amount, plugin, id } = withdrawal
    const currency = PluginToCurrencyMap[plugin]
    const currencyType = CurrencyTypeMap[currency]
    const actionType =
      currencyType === 'cash' ? 'cash_withdraw' : 'crypto_withdraw'

    const isLocked = await userIsLocked(user)

    if (isLocked) {
      return {
        isDeclined: true,
        reason: 'ACCOUNT_LOCKED',
        message: 'account__locked',
      }
    }

    const transactionPayload = {
      type: plugin,
      amount,
      currency,
      id,
    }

    let preScreenFields = {}
    let chainalysisPrescreen:
      | Awaited<ReturnType<typeof withdrawPreScreen>>
      | undefined

    if (actionType === 'crypto_withdraw' && isCryptoSymbol(currency)) {
      chainalysisPrescreen = await withdrawPreScreen(
        user.id,
        currency,
        withdrawal.fields.address,
      )

      // Write to prescreen fields sent to Seon.
      preScreenFields = {
        cluster_name: chainalysisPrescreen?.analysis?.cluster?.name || '',
        cluster_category:
          chainalysisPrescreen?.analysis?.cluster?.category || '',
        rating: chainalysisPrescreen?.analysis?.rating || '',
      }
    }

    const fraudResponse = await assessRisk({
      user,
      ip: withdrawal.userIp || '',
      actionType,
      session,
      transaction: transactionPayload,
      customFields: { ...customFields, ...preScreenFields },
    })

    if (fraudResponse.state === RiskStatus.DECLINED) {
      return {
        isDeclined: true,
        reason: 'SEON_CHECK',
      }
    }

    const { seonResponse } = fraudResponse

    // After running Seon check, return failure if chainalysis check failed.
    if (chainalysisPrescreen?.isHighRisk) {
      return {
        isDeclined: true,
        reason: 'CHAINALYSIS_CHECK',
        message: chainalysisPrescreen.message,
      }
    }

    // Check this again because some risk functions may disable users.
    const isEnabled = await checkSystemEnabled(user, 'withdraw')

    if (!isEnabled) {
      return {
        isDeclined: true,
        reason: 'RISK_CHECK',
        message: 'action__disabled',
      }
    }

    // Lastly, loop through all rules to see if any match a "flagged" state.
    for (const rule of seonResponse?.data.applied_rules ?? []) {
      if (rule.name.includes('WD Flagged MR')) {
        return {
          isFlagged: true,
        }
      }
    }

    return {
      isDeclined: false,
    }
  } catch (error) {
    withdrawLogger('checkForRisk', { userId: user.id }).error(
      `User ${user.id} with withdrawal ${withdrawal.id} failed risk check`,
      { withdrawal },
      error,
    )

    return {
      isDeclined: true,
      reason: 'RISK_CHECK',
    }
  }
}
