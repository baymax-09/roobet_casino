import { config } from 'src/system'
import { checkMatchPromoUserCanWithdraw } from 'src/modules/promo/documents/match_promo'
import { type Types as UserTypes, updateUser } from 'src/modules/user'
import { getBalanceFromUserAndType } from 'src/modules/user/balance'
import { APIValidationError } from 'src/util/errors'
import { checkSystemEnabled } from 'src/modules/userSettings'
import { type BalanceType } from 'src/modules/user/types'
import { assertBetGoalIsMet } from 'src/modules/user/lib/betGoal'
import { hasSurpassedDailyWithdrawLimit } from 'src/modules/user/lib/withdrawLimit'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'

import { type WithdrawalPluginType } from '../types'
import { type Types } from 'src/modules/withdraw'

interface EssentialValidationArgs {
  user: UserTypes.User
  amount: number
  totalValue: number
  balanceReturn: {
    balance: number
    balanceType: BalanceType
  }
  balanceType: BalanceType
}

const balanceTypeToWithDrawMethod = (
  value: BalanceType,
): WithdrawalPluginType[] => {
  const balanceTypeToWithDrawMethodMap: Record<
    BalanceType,
    WithdrawalPluginType[]
  > = {
    cash: [
      'ethereum',
      'bitcoin',
      'litecoin',
      'usdc',
      'tether',
      'ripple',
      'dogecoin',
      'tron',
    ],
    crypto: ['bitcoin'],
    eth: ['ethereum'],
    ltc: ['litecoin'],
    usdt: ['tether'],
    usdc: ['usdc'],
    xrp: ['ripple'],
    doge: ['dogecoin'],
    trx: ['tron'],
  }
  return balanceTypeToWithDrawMethodMap[value] ?? []
}

const validateWithdrawPluginToBalanceType = ({
  balanceType,
  withdrawalPlugin,
}: {
  balanceType: BalanceType
  withdrawalPlugin: WithdrawalPluginType
}) => {
  return balanceTypeToWithDrawMethod(balanceType).includes(withdrawalPlugin)
}

export async function essentialValidation({
  user,
  amount,
  totalValue,
  balanceReturn,
  balanceType,
}: EssentialValidationArgs) {
  if (
    user.maxWithdraw === 0 ||
    (user.maxWithdraw && user.maxWithdraw < totalValue)
  ) {
    throw new APIValidationError('max_withdraw_error')
  }

  if (!user.emailVerified) {
    throw new APIValidationError('withdrawal__verify_email')
  }

  if (balanceReturn.balance <= 0 || amount > balanceReturn.balance) {
    throw new APIValidationError('not_enough_balance')
  }

  const { surpassedDailyWithdrawLimit, amountAvailable, dailyWithdrawLimit } =
    await hasSurpassedDailyWithdrawLimit(user, totalValue)

  if (surpassedDailyWithdrawLimit) {
    const convertedAmountAvailable = await exchangeAndFormatCurrency(
      amountAvailable,
      user,
    )
    const convertedWithdrawalLimit = await exchangeAndFormatCurrency(
      dailyWithdrawLimit,
      user,
    )
    throw new APIValidationError('withdrawal__daily_allowance', [
      convertedAmountAvailable,
      convertedWithdrawalLimit,
    ])
  }

  if (user.howieDeal) {
    if (!user.howieDeal.total) {
      // start it son!
      user.howieDeal.total = balanceReturn.balance
      user.howieDeal.remaining =
        balanceReturn.balance * ((user?.howieDeal?.percent ?? 0) / 100)
      await updateUser(user.id, {
        howieDeal: {
          total: user.howieDeal.total,
          remaining: user.howieDeal.remaining,
        },
      })
    }
    // @ts-expect-error howie deal
    if (user.howieDeal.remaining < totalValue) {
      throw new APIValidationError(
        `This exceeds your howie deal ($${Math.floor(
          // @ts-expect-error howie deal
          user.howieDeal.remaining,
        ).toFixed(0)} remaining).`,
      )
    }
  }

  if (
    !(await checkMatchPromoUserCanWithdraw(user.id, balanceReturn.balanceType))
  ) {
    throw new APIValidationError('withdrawal__match_promo')
  }

  if (!balanceType) {
    throw new APIValidationError('invalid__currency')
  }

  await assertBetGoalIsMet(user, balanceType)

  const isEnabled = await checkSystemEnabled(user, 'withdraw')
  if (!isEnabled) {
    throw new APIValidationError('action__disabled')
  }
}

export async function validateWithdrawal(
  user: UserTypes.User,
  withdrawal: Types.WithdrawalRequest,
  balanceType: BalanceType,
) {
  const { amount, totalValue } = withdrawal

  const balanceReturn = await getBalanceFromUserAndType({ user, balanceType })

  /*
   * Check if the user can withdraw with this withdrawal method for the currently selected balance.
   */
  const isValidPlugin = validateWithdrawPluginToBalanceType({
    balanceType: balanceReturn.balanceType,
    withdrawalPlugin: withdrawal.plugin,
  })
  if (!isValidPlugin) {
    throw new APIValidationError('withdrawal__invalid_method', [
      balanceReturn.balanceType,
      withdrawal.plugin,
    ])
  }

  if (totalValue < config.wallet.minWithdraw) {
    const convertedMin = await exchangeAndFormatCurrency(
      config.wallet.minWithdraw,
      user,
    )
    throw new APIValidationError('withdrawal__convertedMin', [
      `${convertedMin}`,
    ])
  }

  await essentialValidation({
    user,
    amount,
    totalValue,
    balanceReturn,
    balanceType,
  })
}

export async function validateWithdrawalForCash(
  user: UserTypes.User,
  amount: number,
) {
  await essentialValidation({
    user,
    amount,
    totalValue: amount,
    balanceReturn: {
      balance: user.cashBalance || 0,
      balanceType: 'cash',
    },
    balanceType: 'cash',
  })
}
