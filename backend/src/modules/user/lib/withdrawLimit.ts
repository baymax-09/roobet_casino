import { config } from 'src/system'

import { type User } from '../types'
import { sumCryptoWithdrawalsInTimePeriod } from 'src/modules/withdraw/documents/withdrawals_mongo'
import { sumCashWithdrawalsInTimePeriod } from 'src/vendors/paymentiq/documents/cash_withdrawal_transactions'
import { sumTransactionsByTypeInTimePeriod } from '../documents/transaction'
import { sumDepositsInTimePeriod } from 'src/modules/deposit'
import { sumCashDepositsInTimePeriod } from 'src/vendors/paymentiq/documents/cash_deposit_transactions'

export const hasSurpassedDailyWithdrawLimit = async (
  user: User,
  amount: number,
) => {
  const now = new Date()
  const twentyFourHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 24)

  const [
    cryptoWithdrawals,
    cashWithdrawals,
    tips,
    cryptoDeposits,
    cashDeposits,
  ] = await Promise.all([
    // Crypto withdrawals.
    sumCryptoWithdrawalsInTimePeriod(user.id, twentyFourHoursAgo, now),

    // Cash withdrawals.
    sumCashWithdrawalsInTimePeriod(user.id, twentyFourHoursAgo, now),

    // Outgoing tips. The final argument is `true` to exclude incoming tips.
    sumTransactionsByTypeInTimePeriod(
      user.id,
      'tip',
      twentyFourHoursAgo,
      now,
      true,
    ),

    // Crypto deposits.
    sumDepositsInTimePeriod(user.id, twentyFourHoursAgo, now),

    // Cash deposits.
    sumCashDepositsInTimePeriod(user.id, twentyFourHoursAgo, now),
  ])

  // Calculate total withdrawals + deposits in the past 24 hours. Taking absolute value of each as a precaution.
  const withdrawAllowance =
    Math.abs(cryptoWithdrawals) + Math.abs(cashWithdrawals) + Math.abs(tips)
  const userDepositedToday = Math.abs(cryptoDeposits) + Math.abs(cashDeposits)

  // Determine withdraw limits.
  const dailyWithdrawLimit = user.dailyWithdrawLimit
    ? user.dailyWithdrawLimit
    : config.dailyWithdrawLimit
  const dynamicDailyWithdrawalLimit = dailyWithdrawLimit + userDepositedToday

  // Used for showing to the user how much they have left to withdrawal, if needed.
  const amountAvailable = dynamicDailyWithdrawalLimit - withdrawAllowance

  return {
    surpassedDailyWithdrawLimit:
      withdrawAllowance + amount > dynamicDailyWithdrawalLimit,
    amountAvailable,
    dailyWithdrawLimit: dynamicDailyWithdrawalLimit,
  }
}
