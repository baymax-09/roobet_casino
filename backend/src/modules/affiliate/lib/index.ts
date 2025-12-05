import moment from 'moment'

import { r } from 'src/system'
import {
  getUserById,
  getUserByName,
  User,
  updateUser,
  removeFieldFromUser,
  type Types as UserTypes,
} from 'src/modules/user'
import { recordStat } from 'src/modules/stats'
import { APIValidationError } from 'src/util/errors'
import { creditBalance } from 'src/modules/user/balance'
import { type HouseGameName } from 'src/modules/game/types'
import { getSystemSetting } from 'src/modules/userSettings'
import {
  sumBulkUserStatFields,
  type UserStats,
} from 'src/modules/stats/documents/userStats'
import { getMostPlayedGameForUser } from 'src/modules/bet/documents/bet_history_mongo'
import { addNoteToUser } from 'src/modules/admin/documents/user_notes'
import {
  getCRMByUserId,
  updateCRMIfNotExist,
} from 'src/modules/crm/documents/crm'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'
import {
  getAffiliateEarningsAggregate,
  safelyRecordAffiliateEarnings,
} from '../documents'
import { affiliateLogger } from './logger'
import { createRakeboost } from 'src/modules/rewards/documents/rakeboost'
import { isWageringTowardsMatchPromo } from 'src/modules/promo/util'

interface AffiliateUserStat {
  uid: string
  username: string
  wagered: number
  favoriteGameId: string
  favoriteGameTitle: string
  gameIdentifier: string
  excludedGames: string[]
}

const tiers = [
  {
    tier: 1,
    cut: 5,
    countRequired: 0,
    wagerRequired: 0,
  },
  {
    tier: 2,
    cut: 6,
    countRequired: 10,
    wagerRequired: 1000,
  },
  {
    tier: 3,
    cut: 7,
    countRequired: 30,
    wagerRequired: 10000,
  },
  {
    tier: 4,
    cut: 8,
    countRequired: 75,
    wagerRequired: 15000,
  },
  {
    tier: 5,
    cut: 9,
    countRequired: 100,
    wagerRequired: 20000,
  },
  {
    tier: 6,
    cut: 10,
    countRequired: 200,
    wagerRequired: 30000,
  },
  {
    tier: 7,
    cut: 11,
    countRequired: 350,
    wagerRequired: 45000,
  },
  {
    tier: 8,
    cut: 12,
    countRequired: 500,
    wagerRequired: 75000,
  },
  {
    tier: 9,
    cut: 13,
    countRequired: 1000,
    wagerRequired: 100000,
  },
  {
    tier: 10,
    cut: 15,
    countRequired: 3000,
    wagerRequired: 250000,
  },
]

/**
 * Affiliate tier is based off of 2 things
 * - number of referred people. user.refCount
 * - $ amount wagered by your referrals (summation)
 */
export async function getAffiliateTier(userId: string) {
  const user = await getUserById(userId)
  if (!user) {
    return {
      current: tiers[0],
      next: tiers[1],
    }
  }

  const count = user.refCount
  if (user.customAffiliateCut) {
    return {
      current: {
        tier: 11,
        cut: user.customAffiliateCut,
      },
    }
  }
  const wagered: number =
    (await User.getAll(user.id, { index: 'affiliateId' })
      .sum('hiddenTotalBet')
      .run()) ?? 0

  let current = tiers[0]
  for (const tier of tiers) {
    if (count >= tier.countRequired && wagered >= tier.wagerRequired) {
      current = tier
    }
  }

  const next = tiers[tiers.indexOf(current) + 1] ?? false

  return {
    current,
    next,
  }
}

export async function getReferredBy(
  user: UserTypes.User,
): Promise<{ referredBy: false | string; canClaim: boolean }> {
  let referredBy: false | string = false
  if (user.affiliateId) {
    const ref = await getUserById(user.affiliateId)
    if (ref) {
      referredBy = ref.name
    }
  }
  const createdAtTime = moment(user.createdAt)
  const timeNow = moment()
  const canClaim = timeNow.diff(createdAtTime, 'hours') < 12
  return { referredBy, canClaim }
}

interface AffiliateUserStatsParams {
  affiliateId?: string
  startDate?: string
  endDate?: string
  limit?: number
  gameIdentifier?: string
  excludedGames?: string
}

export async function getAffiliateUserStats({
  affiliateId,
  startDate,
  endDate,
  limit,
  gameIdentifier,
  excludedGames,
}: AffiliateUserStatsParams) {
  if (!affiliateId) {
    return null
  }
  const start = startDate
    ? moment(startDate).startOf('day').toISOString()
    : moment().subtract(29, 'days').startOf('day').toISOString()
  const end = endDate
    ? moment(endDate).endOf('day').toISOString()
    : moment().toISOString()
  const userLimit = Math.min(limit ?? 100, 300) // Do not load more than 300
  let excludedGamesWithBet: string[] = []
  let excludedGamesArray: string[] = []
  if (excludedGames) {
    excludedGamesArray = excludedGames.split(',').map(game => game.trim())
    // game identifiers for bet amount always ends with bet (ex. minesBet, towersBet)
    excludedGamesWithBet = excludedGamesArray.map(game => `${game}Bet`)
  }

  /**
   * This query really stinks, but it's also bespoke for literally one user.
   * The problem is we have no easy way to relate bets within a time range with users
   * that have a particular affiliate id.
   */
  const dbUsers = await User.getAll(affiliateId, { index: 'affiliateId' })
    .filter(r.row('lastBet').toISO8601().gt(start))
    .pluck('id', 'name')
    .run()

  // We're going to have to fetch stats data in bulk to limit trips to the DB.
  // Theoretically there could be thousands of users and we want to avoid pummeling the DB.
  const chunkSize = 100
  const allTotalBets: Record<string, number> = {}
  let offset = 0

  // Fetching stats in bulk
  let userChunk = dbUsers.slice(offset, chunkSize)
  const field: keyof UserStats = gameIdentifier
    ? `${gameIdentifier}Bet`
    : excludedGamesWithBet.length > 0
      ? 'filteredTotalBet'
      : 'totalBet'
  while (userChunk.length > 0) {
    const userStats = await sumBulkUserStatFields(
      userChunk.map(user => user.id),
      start,
      end,
      gameIdentifier,
      excludedGamesWithBet,
    )
    if (Array.isArray(userStats)) {
      userStats.forEach(userStat => {
        if (userStat._id) {
          const userId = userStat._id.toString()
          allTotalBets[userId] = userStat[field] ?? 0
        }
      })
    }
    offset += chunkSize
    userChunk = dbUsers.slice(offset, offset + chunkSize)
  }

  // Building initial stats
  const usersWithBetTotals = await Promise.all(
    dbUsers.map(async (user: UserTypes.DBUser) => {
      const totalBet = allTotalBets[user.id] ?? 0

      const affiliateUserStat: AffiliateUserStat = {
        uid: user.id,
        username: user.name,
        wagered: totalBet,
        favoriteGameId: 'N/A',
        favoriteGameTitle: 'N/A',
        gameIdentifier: gameIdentifier ?? 'N/A',
        excludedGames: excludedGamesWithBet ?? ['N/A'],
      }
      return affiliateUserStat
    }),
  )

  // Sort, limit, and finish hydrating the users
  const hydratedUsers = await Promise.all(
    usersWithBetTotals
      .sort((a: AffiliateUserStat, b: AffiliateUserStat) =>
        Number(a.wagered) < Number(b.wagered) ? 1 : -1,
      )
      .slice(0, userLimit)
      .map(async (stats: AffiliateUserStat) => {
        const isIncognito = await getSystemSetting(
          stats.uid,
          'feed',
          'incognito',
        )
        const mostPlayed = await getMostPlayedGameForUser(stats.uid, start, end)

        const affiliateUserStat: AffiliateUserStat = {
          ...stats,
          username: isIncognito ? 'hidden' : stats.username,
          // Theoretically these should never be undefined, but better safe than sorry.
          favoriteGameId: mostPlayed?._id ?? 'N/A',
          favoriteGameTitle:
            mostPlayed?.gameNameDisplay ?? mostPlayed?.gameName ?? 'N/A',
          gameIdentifier: gameIdentifier ?? 'N/A',
          excludedGames: excludedGamesWithBet ?? ['N/A'],
        }
        return affiliateUserStat
      }),
  )
  return hydratedUsers
}

export async function getAffiliateReport(userId: string, daysAgo = 7) {
  if (!userId) {
    return false
  }
  if (daysAgo > 30) {
    daysAgo = 30
  }

  const user = await getUserById(userId)
  if (!user) {
    return false
  }

  const { earningsPerDay, earningsPerUser } =
    await getAffiliateEarningsAggregate(userId, daysAgo)

  let referredBy: string | false = false
  if (user.affiliateId) {
    const ref = await getUserById(user.affiliateId)
    if (ref) {
      referredBy = ref.name
    }
  }

  const payload = {
    referralCount: user.refCount,
    referralsWagered: await User.getAll(user.id, { index: 'affiliateId' })
      .sum('hiddenTotalBet')
      .run(),
    referralsDeposited: await User.getAll(user.id, { index: 'affiliateId' })
      .sum('hiddenTotalDeposited')
      .run(),
    earnedTotal: user.referralEarnings,
    newDepositorCount: await User.getAll(userId, { index: 'affiliateId' })
      .filter(r.row('hiddenTotalDeposited').gt(0))
      .count()
      .run(),
    depositCount: await User.getAll(userId, { index: 'affiliateId' })
      .sum('hiddenTotalDeposits')
      .run(),
    tier: await getAffiliateTier(userId),
    earningsPerDay,
    earningsPerUser,
    referredBy,
  }

  return payload
}

/**
 * - Restrictions:
 *   - Earnings must be greater than $5
 *   - At least 10 people referred
 *   - At least 10 people wagered over $100
 */
export async function claimAffiliateEarnings(userId: string) {
  const user = await getUserById(userId)
  if (!user) {
    throw new APIValidationError('affiliate__error_claiming')
  }
  const logger = affiliateLogger('claimAffiliateEarnings', { userId })
  const earnings = user.affiliateUnpaid

  // TODO: This property only exists one user in production.
  // We ought to create an `affiliate` tag for users with unique schema.
  if (!user.isSponsor && !user.bypassAffiliateRequirements) {
    if (user.refCount < 10) {
      throw new APIValidationError('affiliate__referrals_deposited', ['10'])
    }

    const refsWageredMoreThan100 = await User.getAll(user.id, {
      index: 'affiliateId',
    })
      .filter(r.row('hiddenTotalDeposited').gt(0))
      .count()
      .run()

    if (refsWageredMoreThan100 < 10) {
      throw new APIValidationError('affiliate__referrals_deposited', ['10'])
    }
  }

  if (earnings < 5) {
    const convertedEarning = await exchangeAndFormatCurrency(5, user)
    throw new APIValidationError('affiliate__convertedEarnings_greater', [
      `${convertedEarning}`,
    ])
  }

  try {
    await updateUser(user.id, { affiliateUnpaid: 0 })

    await creditBalance({
      user,
      amount: earnings,
      meta: {
        betAmount: 0,
      },
      transactionType: 'affiliate',
      balanceTypeOverride: 'crypto',
    })
    logger.info('Affiliate Claim', { earnings })
  } catch (error) {
    logger.error('Error', { earnings }, error)
    throw new APIValidationError('affiliate__error_claiming')
  }
}

export async function addAffiliateEarnings(
  user: UserTypes.User,
  betAmount: number,
  gameName: HouseGameName | string, // TODO make a type for all gameNames
  edge: number,
) {
  const logger = affiliateLogger('addAffiliateEarnings', { userId: user.id })

  const wageringTowardsMatchPromo = await isWageringTowardsMatchPromo(user.id)
  if (wageringTowardsMatchPromo) {
    return
  }

  const customPayout = await checkForCustomPayout(user, betAmount, edge)
  if (customPayout) {
    logger.info('done custom payout')
    return
  }

  // check if the user was brought by someone.
  if (!user.affiliateId) {
    return
  }

  const referredBy = await getUserById(user.affiliateId)

  if (!referredBy) {
    return
  }

  const referredByCRM = await getCRMByUserId(referredBy.id)

  // If referrer's earnings are handled in Cellxpert, skip.
  if (referredByCRM?.selfCxAffId) {
    return
  }

  const tier = await getAffiliateTier(referredBy.id)

  const cut = user.aScore || user.customAffiliateCut || tier.current.cut
  // TODO straighten out gameName vs string types
  const houseProfit = (edge / 100) * betAmount
  if (!houseProfit) {
    return
  }

  let addToUnpaid = (cut / 100) * houseProfit
  addToUnpaid = 0.9 * addToUnpaid
  if (isNaN(addToUnpaid)) {
    logger.error('addToUnpaid isNaN value', {
      addToUnpaid,
      referredById: referredBy.id,
      gameName,
    })
    return
  }
  try {
    // Write user stats.
    await updateUser(referredBy.id, {
      referralEarnings: r
        .row('referralEarnings')
        .add(addToUnpaid)
        .default(addToUnpaid),
      affiliateUnpaid: r
        .row('affiliateUnpaid')
        .add(addToUnpaid)
        .default(addToUnpaid),
    })
    await recordStat(
      referredBy,
      { key: 'affiliateEarningsAdded', amount: addToUnpaid },
      true,
    )

    // Record earnings in history table.
    safelyRecordAffiliateEarnings({
      affiliateUserId: referredBy.id,
      referralUserId: user.id,
      referralUsername: user.name,
      amount: addToUnpaid,
    })
  } catch (err) {
    logger.error('error', err)
  }
}

export async function checkForCustomPayout(
  user: UserTypes.User,
  betAmount: number,
  edge: number,
) {
  const customAffiliatePayouts: Record<string, any> = {
    // stevewilldoit
    '45690c2d-04b0-4d78-9523-00207d8c95a3': [
      [2.5, '1994e3ab-e523-4840-901c-40f38929d4cc'], // jason
      [5, 'fe206aeb-93cf-47f0-adc3-c14dae6174c9'], // steves fam
    ],
    // test user
    'c0231316-6599-f9e-b7cf-efaa2bf3cb2c': [
      [3, '092cfb1e-d3cf-46f1-8c4d-0f42158e8bc2'],
      [5, '00f17979-20de-4d53-96c6-1b71013e8f73'],
    ],
  }
  // custom payout logic for stevewilldoit
  if (customAffiliatePayouts[user.id]) {
    // TODO straighten out gameName vs string type
    const houseProfit = (edge / 100) * betAmount
    if (!houseProfit) {
      return
    }

    const logger = affiliateLogger('checkForCustomPayout', { userId: user.id })
    for (const [cut, affiliateId] of customAffiliatePayouts[user.id]) {
      const affiliate = await getUserById(affiliateId)
      if (!affiliate) {
        logger.info('Failed to get affiliate', { affiliateId })
        continue
      }
      let addToUnpaid = (cut / 100) * houseProfit
      addToUnpaid = 0.9 * addToUnpaid
      logger.info('Paying out custom affiliate cut', {
        affiliateId,
        addToUnpaid,
        cut,
      })
      await updateUser(affiliateId, {
        affiliateUnpaid: r
          .row('affiliateUnpaid')
          .add(addToUnpaid)
          .default(addToUnpaid),
      })
      await updateUser(affiliateId, {
        referralEarnings: r
          .row('referralEarnings')
          .add(addToUnpaid)
          .default(addToUnpaid),
      })
      await recordStat(
        affiliate,
        { key: 'affiliateEarningsAdded', amount: addToUnpaid },
        true,
      )
    }
    return true
  } else {
    return false
  }
}

export async function adminUpdateAffiliate(
  userId: string,
  affiliateName: string,
  staffUserId: string | undefined,
) {
  const user = await getUserById(userId)
  if (!user) {
    throw new APIValidationError('user__invalid_id')
  }

  if (!affiliateName) {
    throw new APIValidationError('affiliate__invalid_name')
  }

  const affiliate = await getUserByName(affiliateName, true)
  if (!affiliate) {
    throw new APIValidationError('affiliate__invalid_name')
  }

  if (affiliate.affiliateLocked) {
    throw new APIValidationError('affiliate__invalid_name')
  }

  if (affiliate.id == userId) {
    throw new APIValidationError('affiliate__invalid_name')
  }

  if (!user.roowardsBonus) {
    await updateUser(user.id, { roowardsBonus: 1000 })
  }

  await updateUser(user.id, { affiliateId: affiliate.id })
  await updateUser(affiliate.id, {
    refCount: r.row('refCount').add(1).default(1),
  })
  await recordStat(affiliate, { key: 'refCount', amount: 1 }, true)
  if (staffUserId) {
    await addNoteToUser(
      user.id,
      user,
      `Affiliated by set to ${affiliate.id} by ${staffUserId}`,
      'admin',
    )
  }
  return {
    success: true,
  }
}

export async function adminClearAffiliate(userId: string, staffUserId: string) {
  const user = await getUserById(userId)
  if (!user) {
    throw new APIValidationError('user__invalid_id')
  }

  await removeFieldFromUser(userId, 'affiliateId')

  await addNoteToUser(
    user.id,
    user,
    `Affiliated by cleared by ${staffUserId}`,
    'admin',
  )
  return {
    success: true,
  }
}

interface AddAffiliateResult {
  success: boolean
  message?: string
}

/**
 * Adds an affiliate to a user's account.
 *
 * @param userId The id of the user who is being referred
 * @param affiliateName The name of the user who is referring
 */
export async function addAffiliate(
  userId: string,
  affiliateName: string,
): Promise<AddAffiliateResult> {
  const user = await getUserById(userId)

  if (!user) {
    return { success: false, message: 'user__invalid_id' }
  }

  if (user.affiliateId && user.roowardsBonus) {
    return { success: false, message: 'affiliate__already_received_bonus' }
  }

  if (!user.roowardsBonus && user.hiddenTotalBet > 1000) {
    return { success: false, message: 'affiliate__account_too_old' }
  }

  const refereeCRM = await getCRMByUserId(userId)

  // We cannot allow users to have both an affiliateId and a cxAffId
  if (refereeCRM?.cxAffId && refereeCRM?.cxd) {
    return { success: false, message: 'affiliate__has__cxd' }
  }

  const affiliate = await getUserByName(affiliateName, true)

  if (!affiliate || affiliate.affiliateLocked || affiliate.id === userId) {
    return { success: false, message: 'affiliate__invalid_name' }
  }

  // If the affiliate's earnings are handled via Cellxpert,
  // store the selfCfAffId on the referee's CRM doc.
  if (!user.affiliateId) {
    const affiliateCRM = await getCRMByUserId(affiliate.id)

    if (affiliateCRM?.selfCxAffId) {
      await updateCRMIfNotExist(user.id, {
        cxd: `${affiliateCRM.selfCxAffId}_0`,
        cxAffId: affiliateCRM.selfCxAffId,
      })
    }
  }

  if (!user.roowardsBonus) {
    await updateUser(user.id, { roowardsBonus: 1000 })
  }

  const createdAtTime = moment(user.createdAt)
  const timeNow = moment()

  // If user.createdAt is greater than 12 hours, don't set ref.
  if (timeNow.diff(createdAtTime, 'hours') < 12 && !user.affiliateId) {
    await updateUser(user.id, { affiliateId: affiliate.id })
    await updateUser(affiliate.id, {
      refCount: r.row('refCount').add(1).default(1),
    })
    await recordStat(affiliate, { key: 'refCount', amount: 1 }, true)
  }

  // Create a rakeboost for the user with affiliate code redemption.
  await createRakeboost(user, 'affiliateCode')

  return { success: true }
}
