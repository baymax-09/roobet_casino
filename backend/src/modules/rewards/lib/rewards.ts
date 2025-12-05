import { type User } from 'src/modules/user/types'
import { determineActiveGame } from 'src/modules/slotPotato'

import { getActiveRakeboost } from 'src/modules/rewards/documents/rakeboost'
import { addRakebackForUser as addRakebackForUserVault } from 'src/modules/rewards/documents/rewards'
import {
  DAILY_RAKEBACK_PERCENTAGE,
  INSTANT_RAKEBACK_PERCENTAGE,
  MONTHLY_RAKEBACK_PERCENTAGE,
  WEEKLY_RAKEBACK_PERCENTAGE,
} from 'src/modules/rewards/util'
import { getActiveSlotPotato } from 'src/modules/slotPotato/documents/slotPotato'
import { determineSingleFeatureAccess } from 'src/util/features'
import { isWageringTowardsMatchPromo } from 'src/modules/promo/util'

export const addUserRewards = async (
  user: User,
  betAmount: number,
  gameId: string,
  edge: number,
): Promise<void> => {
  const rewardsRedesignEnabled = await determineSingleFeatureAccess({
    countryCode: '',
    featureName: 'rewardsRedesign',
    user,
  })

  if (!rewardsRedesignEnabled) {
    return
  }

  const wageringTowardsMatchPromo = await isWageringTowardsMatchPromo(user.id)

  // Disabled conditions.
  if (user.roowardsDisabled || wageringTowardsMatchPromo) {
    return
  }

  const houseExpectedIncome = (edge / 100) * betAmount

  // Instant rakeback changes if there is a rakeboost active.
  const rakeboost = await getActiveRakeboost(user.id)
  const instantPercentage = rakeboost
    ? rakeboost.rakebackPercentage
    : INSTANT_RAKEBACK_PERCENTAGE

  let instantAmount = ((instantPercentage ?? 0) / 100) * houseExpectedIncome
  const dailyAmount = (DAILY_RAKEBACK_PERCENTAGE / 100) * houseExpectedIncome
  const weeklyAmount = (WEEKLY_RAKEBACK_PERCENTAGE / 100) * houseExpectedIncome
  const monthlyAmount =
    (MONTHLY_RAKEBACK_PERCENTAGE / 100) * houseExpectedIncome

  // Double instant rakeback when slot potato active.
  const activeSlotPotato = await getActiveSlotPotato()
  if (activeSlotPotato && !activeSlotPotato.disabled) {
    const { startDateTime, games, gameDuration } = activeSlotPotato
    const activeGame = determineActiveGame(startDateTime, gameDuration, games)
    if (activeGame?.gameId?.toString() === gameId) {
      instantAmount *= 2
    }
  }

  await addRakebackForUserVault({
    userId: user.id,
    instantAmount,
    dailyAmount,
    weeklyAmount,
    monthlyAmount,
  })
}
