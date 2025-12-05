import numeral from 'numeral'

import {
  updateTotalWithdrawn,
  decrementMaxWithdraw,
  updateUser,
  createNotification,
} from 'src/modules/user'
import { type User } from 'src/modules/user/types'
import { slackTransaction, slackTransactionHr } from 'src/vendors/slack'
import { translateForUser } from 'src/util/i18n'

import { type WithdrawStatus, type WithdrawalRequest } from '../types'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'
import { withdrawLogger } from './logger'

interface NotifyArgs {
  user: User
  totalValue: number
  transactionId: string
  status: WithdrawStatus
  type: 'paymentIq'
}

export async function notifyOnUpdate({
  user,
  totalValue,
  transactionId,
  status,
  type,
}: NotifyArgs) {
  const StatusMap: Partial<Readonly<Record<WithdrawStatus, string>>> = {
    pending: 'withdrawal__pending_cash',
    completed: 'withdrawal__complete_cash',
    declined: 'withdrawal__declined_cash',
    failed: 'withdrawal__failed_cash',
    cancelled: 'withdrawal__cancelled_cash',
  }
  const transKey = StatusMap[status]

  try {
    if (transKey) {
      const convertedTotalValue = await exchangeAndFormatCurrency(
        totalValue,
        user,
      )
      const message = translateForUser(user, transKey, [
        convertedTotalValue,
        transactionId,
      ])
      await createNotification(user.id, message, 'withdraw', {
        amount: totalValue,
        transactionId,
        type,
      })
    }
  } catch (error) {
    withdrawLogger('notifyOnUpdate', { userId: user.id }).error(
      'error sending withdrawal notification',
      {
        amount: totalValue,
        transactionId,
        type,
      },
      error,
    )
  }
}

export async function postWithdrawalHooks(
  user: User,
  withdrawal: WithdrawalRequest,
) {
  await updateTotalWithdrawn(user.id, withdrawal.totalValue)
  await decrementMaxWithdraw(user.id, withdrawal.totalValue)

  const formattedAmount = numeral(withdrawal.totalValue).format('0,0.00')

  if (user.howieDeal) {
    await updateUser(user.id, {
      howieDeal: {
        // @ts-expect-error howie deal
        remaining: user.howieDeal.remaining - withdrawal.totalValue,
      },
    })
  }

  slackTransaction(
    `*${user.name}* [${user.id}] is withdrawing *${formattedAmount}* USD via ${withdrawal.plugin}`,
  )
  if (withdrawal.totalValue >= 100) {
    slackTransactionHr(
      `*${user.name}* [${user.id}] is withdrawing *${formattedAmount}* USD via ${withdrawal.plugin}`,
    )
  }

  return true
}
