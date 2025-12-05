import moment from 'moment'

import { creditBalance } from 'src/modules/user/balance'
import { APIValidationError } from 'src/util/errors'
import { sumUserStatFields } from 'src/modules/stats'
import { type User } from 'src/modules/user/types'
import {
  determineActiveGame,
  Documents as SlotPotatoDocuments,
} from 'src/modules/slotPotato'

import {
  getRoowardsForUserId,
  addRakebackForUser,
  setRakebackZeroForUser,
} from '../documents/Roowards'
import { getLevels } from '../'
import { roowardsLogger } from './logger'
import { isWageringTowardsMatchPromo } from 'src/modules/promo/util'

const { getActiveSlotPotato } = SlotPotatoDocuments.slotPotato

export const ROOWARD_TIMESPANS = ['d', 'w', 'm'] as const
export type RoowardTimespan = (typeof ROOWARD_TIMESPANS)[number]

export const isValidRoowardsTimespan = (value: any): value is RoowardTimespan =>
  ROOWARD_TIMESPANS.includes(value)

export const rewardMap: Record<RoowardTimespan, { daysAgo: number }> = {
  /* eslint-disable id-length */
  d: {
    daysAgo: 1,
  },
  w: {
    daysAgo: 7,
  },
  m: {
    daysAgo: 30,
  },
  /* eslint-enable id-length */
}

export async function addUserRoowards(
  user: User,
  betAmount: number,
  gameId: string,
  edge: number,
): Promise<void> {
  const wageringTowardsMatchPromo = await isWageringTowardsMatchPromo(user.id)

  // Disabled conditions.
  if (user.roowardsDisabled || wageringTowardsMatchPromo) {
    return
  }

  const houseExpectedIncome = (edge / 100) * betAmount
  const levels = await getLevels(user)

  let dAmount = ((levels.d.percent ?? 0) / 100) * houseExpectedIncome
  let wAmount = ((levels.w.percent ?? 0) / 100) * houseExpectedIncome
  let mAmount = ((levels.m.percent ?? 0) / 100) * houseExpectedIncome

  // Apply any active SlotPotato rakeback bonuses
  const activeSlotPotato = await getActiveSlotPotato()
  if (activeSlotPotato && !activeSlotPotato.disabled) {
    const { startDateTime, games, gameDuration } = activeSlotPotato
    const activeGame = determineActiveGame(startDateTime, gameDuration, games)
    if (activeGame?.gameId?.toString() === gameId) {
      dAmount *= 3
      wAmount *= 3
      mAmount *= 3
    }
  }

  addRakebackForUser(user.id, dAmount, wAmount, mAmount)
}

/**
 * Used to either claim Roowards, or calculate whether rakeback is available(dryRun).
 * @todo split out the calculation from the actual crediting so we don't have to have dryRun
 */
export async function claimRoowards(
  user: User,
  type: RoowardTimespan,
  dryRun = false,
): Promise<boolean | number> {
  if (!dryRun && user.selectedBalanceType === 'cash') {
    throw new APIValidationError('roowards__no_cash')
  }

  const levels = await getLevels(user)
  const rewardSettings = rewardMap[type]
  const userRoowards = await getRoowardsForUserId(user.id)
  const lastClaimed = userRoowards[`${type}LastClaimed`]
  const timeDaysAgo = moment().subtract(rewardSettings.daysAgo, 'days')
  const canClaim =
    moment(lastClaimed).isBefore(timeDaysAgo) && levels[type].percent

  if (!canClaim) {
    if (dryRun) {
      return false
    }

    throw new APIValidationError('roowards__not_ready')
  }

  const rakebackAmount = userRoowards[`${type}Amount`]

  // right here, we want to use lossback percent, see if its higher than rakeback.. if so use that # instead.
  const userStats = await sumUserStatFields(
    user.id,
    moment().subtract(rewardSettings.daysAgo, 'days').toISOString(),
    moment().toISOString(),
    ['totalBet', 'totalWon', 'sportsbookBet', 'sportsbookWon'],
  )

  const totalLosses = (userStats.totalBet || 0) - (userStats.totalWon || 0)
  const sportsbookLosses =
    (userStats.sportsbookBet || 0) - (userStats.sportsbookWon || 0)

  // TODO: Revert this change when stats are fixed.
  // Temporarily subtract sportsbook losses.
  const userLosses = Math.max(totalLosses, 0) - Math.max(sportsbookLosses, 0)

  const userLossback =
    Math.max(userLosses, 0) * ((levels[type].percent ?? 0) / 100)

  const logger = roowardsLogger('claimRoowards', { userId: user.id }).info(
    'Roowards Claimed:',
    { userLossback, userLosses, rakebackAmount },
  )

  let amount = rakebackAmount

  // Only use rakeback for daily, others use lossback.
  // TODO: Explain why we do this.
  if (userLossback > rakebackAmount && type !== 'd') {
    amount = userLossback
  }

  if (!amount || amount < 0.01) {
    if (dryRun) {
      return false
    }

    throw new APIValidationError('roowards__not_enough')
  }

  if (dryRun) {
    return true
  }

  await creditBalance({
    user,
    amount,
    transactionType: 'roowards',
    meta: {
      type,
      amountClaimed: amount,
      levelsAtClaim: levels,
      userLossBackUsedForAmount: userLossback > rakebackAmount && type !== 'd',
      totalLosses,
      sportsbookLosses,
      userLossback,
      rakebackAmount,
    },
    balanceTypeOverride: null,
  })

  await setRakebackZeroForUser(user.id, type)

  logger.info('Roowards Claimed', {
    type,
    amount,
    percentCashback: levels[type].percent,
  })

  return amount
}
