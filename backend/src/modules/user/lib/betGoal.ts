import { config, r } from 'src/system'

import { checkSystemEnabled } from 'src/modules/userSettings'
import { getActiveBetsForUser } from 'src/modules/bet/documents/active_bet'
import { APIValidationError } from 'src/util/errors'
import { getWagerRequirement } from 'src/util/helpers/wagerRequirements'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'

import { type Types as UserTypes } from 'src/modules/user'
import { getUserById, updateUser } from '../documents/user'
import {
  getBalanceFromUserAndType,
  getUserBetGoalFieldFromBalanceType,
  isPortfolioBalanceType,
} from '../balance'
import { BetGoal } from '../documents'

export async function modifyBetGoal(
  userId: string,
  amountToAdd: number,
  balanceTypeOverride: UserTypes.BalanceType,
  adjustBetGoal = true,
) {
  const user = await getUserById(userId)
  if (!user) {
    throw new APIValidationError('user__does_not_exist')
  }
  if (isPortfolioBalanceType(balanceTypeOverride)) {
    if (amountToAdd >= 0) {
      await BetGoal.incrementBetGoal({
        userId: user.id,
        balanceType: balanceTypeOverride,
        amount: amountToAdd,
      })
    } else {
      await BetGoal.decrementBetGoal({
        userId: user.id,
        balanceType: balanceTypeOverride,
        amount: Math.abs(amountToAdd),
      })
    }
  } else {
    const betGoalField = getUserBetGoalFieldFromBalanceType(balanceTypeOverride)
    // TODO write a more specific update in the document for this
    await updateUser(userId, {
      [betGoalField]: r.branch(
        r.row(betGoalField).add(amountToAdd).default(amountToAdd).gt(0),
        r.row(betGoalField).add(amountToAdd).default(amountToAdd),
        0,
      ),
    })
    if (adjustBetGoal) {
      await setAdjustedBetGoal(user, balanceTypeOverride)
    }
  }
}

async function setAdjustedBetGoal(
  user: UserTypes.User,
  balanceTypeOverride: UserTypes.UserObjectBalanceType,
) {
  const adjustedBetGoal = await getAdjustedBetGoal(user, balanceTypeOverride)
  const betGoalField = getUserBetGoalFieldFromBalanceType(balanceTypeOverride)
  if (adjustedBetGoal !== false) {
    await updateUser(user.id, { [betGoalField]: adjustedBetGoal })
  }
}

async function getAdjustedBetGoal(
  user: UserTypes.User,
  balanceTypeOverride: UserTypes.BalanceType,
): Promise<number | boolean> {
  // Check if the user's balance is below the threshold for equivalent to zero.
  const balanceReturn = await getBalanceFromUserAndType({
    user,
    balanceType: balanceTypeOverride,
  })
  const activeBets = await getActiveBetsForUser(user.id)
  if (
    !activeBets.length &&
    balanceReturn.balance < config.minimumBetGoalBalance
  ) {
    return 0
  }
  return false
}

export async function resetBetGoal(
  userId: string,
  balanceTypeOverride: UserTypes.BalanceType,
) {
  const user = await getUserById(userId)
  if (!user) {
    throw new APIValidationError('user__does_not_exist')
  }
  if (isPortfolioBalanceType(balanceTypeOverride)) {
    return await BetGoal.resetBetGoal({
      userId: user.id,
      balanceType: balanceTypeOverride,
    })
  }
  const betGoalField = getUserBetGoalFieldFromBalanceType(balanceTypeOverride)
  await updateUser(userId, { [betGoalField]: 0 })
}

const remainingBetGoal = async (
  user: UserTypes.User,
  balanceType: UserTypes.BalanceType,
) => {
  if (isPortfolioBalanceType(balanceType)) {
    const betGoal = await BetGoal.getBetGoal({ userId: user.id })
    return betGoal?.[balanceType] || 0
  } else {
    const betGoalField = getUserBetGoalFieldFromBalanceType(balanceType)

    return user[betGoalField] ?? 0
  }
}

async function isBetGoalMet(
  user: UserTypes.User,
  balanceType: UserTypes.BalanceType,
  isBetGoalOverridden: boolean,
) {
  const betGoalAmount = await remainingBetGoal(user, balanceType)
  return {
    betGoalIsMet: !(betGoalAmount > 0) || isBetGoalOverridden,
    betGoalRemaining: betGoalAmount,
  }
}

export const assertBetGoalIsMet = async (
  user: UserTypes.User,
  balanceType: UserTypes.BalanceType,
) => {
  const isBetGoalOverridden = await checkSystemEnabled(user, 'overrideBetGoal')
  const { betGoalIsMet, betGoalRemaining } = await isBetGoalMet(
    user,
    balanceType,
    isBetGoalOverridden,
  )
  if (!betGoalIsMet) {
    const wagerPercentRemaining = getWagerRequirement(balanceType) * 100
    const convertedRemaining = await exchangeAndFormatCurrency(
      betGoalRemaining,
      user,
    )
    throw new APIValidationError('deposit__convertedWager_requirement', [
      `${wagerPercentRemaining}%`,
      `${convertedRemaining}`,
    ])
  }
}
