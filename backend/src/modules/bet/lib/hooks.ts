import numeral from 'numeral'

import { r, config } from 'src/system'
import { shouldRecordStatsForUser } from 'src/modules/stats'
import { Timeseries } from 'src/util/redisModels'
import { processOffer } from 'src/modules/adnetworks'
import { modifyBetGoal } from 'src/modules/user/lib/betGoal'
import { updateIntercomContact } from 'src/vendors/intercom'
import { incrementGamePreference } from 'src/modules/stats/documents/lifetimeUserStats'
import { addAffiliateEarnings } from 'src/modules/affiliate/lib'
import { updateFavorite } from 'src/modules/tp-games/documents/favorites'
import { addRecent } from 'src/modules/tp-games/documents/recents'
import { rewardKoth, rewardKothCrash } from 'src/modules/koth/lib'
import {
  type Types as UserTypes,
  userIsLocked,
  updateUser,
} from 'src/modules/user'
import { addUserRoowards } from 'src/modules/roowards/lib'
import {
  matchPromoBetHook,
  checkUserMatchPromoCanPlayGame,
} from 'src/modules/promo/documents/match_promo'
import { checkSystemEnabled } from 'src/modules/userSettings'
import { type TPGame } from 'src/modules/tp-games'
import { addToActiveRaffles } from 'src/modules/raffle/lib/ops'
import { isDisabled } from 'src/modules/tp-games/documents/blocks'
import { slackBigDepositExperience, slackFTDAlert } from 'src/vendors/slack'
import {
  getFirstCompletedDeposit,
  sumDepositsInTimePeriod,
} from 'src/modules/deposit/documents/deposit_transactions_mongo'
import {
  getBalanceFromUserAndType,
  mapBalanceInformation,
  totalBalance,
} from 'src/modules/user/balance'
import {
  createUserOpLog,
  getMostRecentOpLog,
  getUserOpLog,
} from 'src/modules/audit/documents/userOpLogs'
import { getMostRecentWithdrawal } from 'src/modules/withdraw/documents/withdrawals_mongo'
import { isBeforeDuration } from 'src/util/helpers/time'
import { APIValidationError } from 'src/util/errors'
import {
  CryptoDepositTypeToBalanceType,
  isValidCryptoDepositType,
} from 'src/modules/deposit/types'

import * as BetLeaderboard from '../documents/bet_leaderboard'
import { type BetHistoryDocument, type BetHistory } from '../types'
import { convertTPHouseGameNameToGameIdentifier } from '../util'
import { getActiveBets } from '../documents/activeBetsMongo'
import { getActiveBetsForUserNotClosedOut } from '../documents/active_bet'
import { incrementRankWagered } from 'src/modules/stats/lib'
import { addUserRewards } from 'src/modules/rewards/lib'

// Until all Betsy sportsbetting bets are close, we need to support it.
const SPORTSBOOK_GAME_ID = 'slotegrator:sportsbook-1'

const isSportsbookGame = (bet: BetHistory): boolean => {
  return !!(bet.gameIdentifier && bet.gameIdentifier === SPORTSBOOK_GAME_ID)
}

const shouldRecordLeaderboard = (bet: BetHistory): boolean => {
  // We do not keep leaderboard results for Sportsbook.
  if (isSportsbookGame(bet)) {
    return false
  }

  return true
}

export async function checkCanPlaceBetOnGame(
  user: UserTypes.User,
  gameName: string,
  game: TPGame | null = null,
  balanceTypeOverride: UserTypes.BalanceType | null = null,
): Promise<
  { canPlaceBet: true; reason: null } | { canPlaceBet: false; reason: string }
> {
  if (!game) {
    return { canPlaceBet: false, reason: 'game__not_found' }
  }

  // TODO remove try-catch when checkSystemEnabled doesn't throw
  try {
    const betsEnabled = await checkSystemEnabled(user, 'bets')
    if (!betsEnabled) {
      return { canPlaceBet: false, reason: 'action__disabled' }
    }
  } catch (error) {
    if (error instanceof APIValidationError) {
      return { canPlaceBet: false, reason: error.message }
    }
    return { canPlaceBet: false, reason: 'action__disabled' }
  }

  const balanceType = balanceTypeOverride ?? user.selectedBalanceType
  const canPlayWithPromo = await checkUserMatchPromoCanPlayGame(
    user,
    gameName,
    game,
    balanceType,
  )
  if (!canPlayWithPromo.canPlaceBet) {
    return canPlayWithPromo
  }

  if (await userIsLocked(user)) {
    return { canPlaceBet: false, reason: 'account__locked' }
  }

  const disabled = await isDisabled(game, user)
  if (disabled) {
    return { canPlaceBet: false, reason: 'game__disabled' }
  }

  return { canPlaceBet: true, reason: null }
}

const globalStatUpdates = async (bet: BetHistory) => {
  if (bet.won) {
    Timeseries.recordTimeseries('globalAmountWon', bet.payoutValue, true)
  }
  Timeseries.recordTimeseries('globalAmountBet', bet.betAmount, true)
}

const gameStatUpdates = async (bet: BetHistory) => {
  // Write leaderboard results to collection.
  if (shouldRecordLeaderboard(bet)) {
    // @ts-expect-error our bet types are incorrect, there is a '_id' field on this bet object
    const { _id, ...restOfBet } = bet
    BetLeaderboard.recordBetLeaderboard(restOfBet)
  }
}

const personalStatUpdate = async (
  user: UserTypes.User,
  bet: BetHistory,
  edge: number,
) => {
  // We want house games be inserted with the housegames:<name> gameIdentifier pattern
  const gameIdentifier = convertTPHouseGameNameToGameIdentifier(
    bet.gameIdentifier!,
  )

  // Update game tracking collections for user.
  updateFavorite(
    { userId: user.id, identifier: gameIdentifier },
    { lastPlayed: new Date() },
  )
  addRecent(
    { userId: user.id, identifier: gameIdentifier },
    { lastPlayed: new Date() },
  )

  // 11-23-2023 - Disabling due to abuse per Matt D.
  // New Player Incentive Promotion: Free spins on first deposit
  // if (bet.category === 'slots' && user.hiddenTotalDeposits && user.hiddenTotalDeposits > 0) {
  //   await checkNewPlayerIncentiveEligibility(user.id, bet.betAmount)
  // }

  // Decrement bet goal for given user balance.
  modifyBetGoal(user.id, -bet.betAmount, bet.balanceType)

  // Send GPT offer callbacks, if applicable.
  processOffer(user)

  // If profit is zero, don't do either of these.
  if (bet.betAmount !== bet.payoutValue) {
    addAffiliateEarnings(user, bet.betAmount, bet.gameName, edge)
    addUserRoowards(user, bet.betAmount, bet.gameId, edge)
    addUserRewards(user, bet.betAmount, bet.gameId, edge)
  }

  // If not admin and stats are enabled, reward user appropriately.
  const shouldRecord = await shouldRecordStatsForUser(user)
  if (shouldRecord) {
    addToActiveRaffles(bet)
    if (!user.isSponsor) {
      rewardKoth(user.id, bet)
      rewardKothCrash(user.id, bet)
    }
  }

  // Set lastBet value on user record to the current time.
  updateUser(user.id, { lastBet: r.now() })

  // Post updated user record to Intercom.
  if (bet.gameName !== 'crash' && bet.gameName !== 'hotbox') {
    updateIntercomContact(user.id)
  }

  // Since we aren't awaiting anything in this hook but the order does matter here
  incrementGamePreference(user.id, bet.category || 'house', bet.betAmount)

  // Decrement match promos left to wager amount.
  matchPromoBetHook(user.id, bet.betAmount, bet.balanceType)

  // Increment how much they have wagered towards their next rank up.
  incrementRankWagered(user, bet.betAmount)
}

/** User had bad FTD experience if these criteria are met:
 * 1. Should only enter the channel if their FTD was at least $10
 * 2. They have exactly 1 crypto deposit (their FTD)
 * 3. Their balance goes under $1 without a withdrawal
 * 4. User should have no active house or provider games or unclosed sportsbook wagers
 * Note: Each player should only ever pop into #alerts-ftd-experience channel once for the lifetime of their account
 */
const checkIfBadFTDExperience = async (user: UserTypes.User) => {
  if (user.hiddenTotalDeposits !== 1 || user.hiddenTotalWithdrawn !== 0) {
    return
  }

  const firstCryptoDeposit = await getFirstCompletedDeposit(user.id)

  if (!firstCryptoDeposit) {
    return
  }
  // If FTD logged, then we have already send the alert
  const ftdLog = await getUserOpLog({
    userId: user.id,
    resource: 'deposits',
    operation: 'sentRententionAlert',
  })

  if (firstCryptoDeposit.amount < 10 || ftdLog) {
    return
  }

  const depositType = firstCryptoDeposit.depositType
  const cryptoBalanceType = isValidCryptoDepositType(depositType)
    ? CryptoDepositTypeToBalanceType[depositType]
    : null

  if (!cryptoBalanceType) {
    return
  }

  const { balance } = await getBalanceFromUserAndType({
    user,
    balanceType: cryptoBalanceType,
  })

  if (balance >= 1) {
    return
  }

  const houseGameActiveBets = await getActiveBetsForUserNotClosedOut(user.id)
  if (houseGameActiveBets.length !== 0) {
    return
  }

  const sportsbookActiveBets = await getActiveBets({
    userId: user.id,
    gameIdentifier: SPORTSBOOK_GAME_ID,
    closedOut: { $exists: false },
  })
  if (sportsbookActiveBets.length !== 0) {
    return
  }

  const message = `${user.name} made a first time deposit of ${numeral(
    firstCryptoDeposit.amount,
  ).format('$0,0.00')} and lost it all without withdrawing`
  slackFTDAlert(message)
  await createUserOpLog({
    userId: user.id,
    resource: 'deposits',
    operation: 'sentRententionAlert',
    category: 'operational',
  })
}

export async function alertForBigDeposits(user: UserTypes.User): Promise<any> {
  const username = user.name
  const ishvOrVip = user.role === 'VIP' || user.role === 'HV'

  // exclude if user is VIP or HV
  if (ishvOrVip) {
    return
  }

  const lastBDLog = await getMostRecentOpLog({
    userId: user.id,
    resource: 'deposits',
    operation: 'sentBDAlert',
  })

  // exclude if user has already been notified in slack within the month
  if (lastBDLog && !isBeforeDuration(lastBDLog.createdAt, 1, 'months')) {
    return
  }

  const lastWithdrawal = await getMostRecentWithdrawal(user.id)
  // get all deposits if user has not withdrawn, otherwise get all deposits after latest withdrawal
  const depositSum = lastWithdrawal?.createdAt
    ? await sumDepositsInTimePeriod(
        user.id,
        lastWithdrawal.createdAt,
        new Date(),
      )
    : await sumDepositsInTimePeriod(user.id, new Date(0), new Date())

  const balance = totalBalance(await mapBalanceInformation(user))

  if (
    depositSum >= config.deposits.alerts.bigDepositLimit &&
    balance < config.deposits.alerts.lossLimit
  ) {
    const message = `${username} deposited a sum of $${numeral(
      depositSum,
    ).format('0,0.00')} and lost it all without withdrawing`
    slackBigDepositExperience(message)
    await createUserOpLog({
      userId: user.id,
      resource: 'deposits',
      operation: 'sentBDAlert',
      category: 'operational',
    })
  }
}

export const afterBetHooks = async ({
  user,
  betHistory,
  edge,
}: {
  user: UserTypes.User
  betHistory: BetHistoryDocument
  edge: number
}) => {
  if (!betHistory) {
    return
  }

  await Promise.allSettled([
    globalStatUpdates(betHistory),
    gameStatUpdates(betHistory),
    personalStatUpdate(user, betHistory, edge),
    checkIfBadFTDExperience(user),
    alertForBigDeposits(user),
  ])
}
