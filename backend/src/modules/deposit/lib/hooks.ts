import { matchPromoDepositHook } from 'src/modules/promo/documents/match_promo'
import { type Types as UserTypes } from 'src/modules/user'
import { updateLastDeposit, createNotification } from 'src/modules/user'
import { modifyBetGoal } from 'src/modules/user/lib/betGoal'
import { translateForUser } from 'src/util/i18n'
import { type BalanceType, type User } from 'src/modules/user/types'
import { getWagerRequirement } from 'src/util/helpers/wagerRequirements'

import { type DepositType, type DepositStatus } from '../types'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'
import { depositLogger } from './logger'
import numeral from 'numeral'
import { slackFTDToVipAlert } from 'src/vendors/slack'

interface NotifyArgs {
  user: User
  amount: number
  transactionId: string
  status: DepositStatus
  type: DepositType
}

export async function notifyOnUpdate({
  user,
  amount,
  transactionId,
  status,
  type,
}: NotifyArgs) {
  const StatusMap: Readonly<Partial<Record<DepositStatus, string>>> = {
    pending: 'deposit__pending_cash',
    completed: 'deposit__completed_cash',
    declined: 'deposit__declined_cash',
    failed: 'deposit__failed_cash',
    cancelled: 'deposit__cancelled',
  }
  const convertedValue = await exchangeAndFormatCurrency(amount, user)
  const transKey = StatusMap[status]
  try {
    if (transKey) {
      const message = translateForUser(user, transKey, [
        convertedValue,
        transactionId,
      ])
      await createNotification(user.id, message, 'deposit', {
        amount,
        transactionId,
        type,
      })
    }
  } catch (error) {
    depositLogger('notifyOnUpdate', { userId: user.id }).error(
      `error sending deposit notification - ${error.message}`,
      {},
      error,
    )
  }
}

const FTDToVipAlert = async (user: UserTypes.User, amount: number) => {
  const firstTimeDeposit = user.hiddenTotalDeposits === 0

  if (!firstTimeDeposit) {
    return
  }

  if (amount >= 2000) {
    const message = `*${user.name}* has deposited $${numeral(amount).format(
      '0,0.00',
    )} in their first time deposit`
    slackFTDToVipAlert(message)
  }
}

export async function afterDepositHooks(
  user: UserTypes.User,
  amount: number,
  balanceType: BalanceType,
) {
  // 11-23-2023 - Disabling due to abuse per Matt D.
  // If user has made their first deposit, they are eligible for our New Player Incentive Promotion
  // if (user.hiddenTotalDeposits === 0) {
  //   await createQuestAfterDeposit(user)
  // }
  await updateLastDeposit(user.id)
  await modifyBetGoal(
    user.id,
    amount * getWagerRequirement(balanceType),
    balanceType,
  )
  await matchPromoDepositHook(user.id, amount, balanceType)
  await FTDToVipAlert(user, amount)
}
