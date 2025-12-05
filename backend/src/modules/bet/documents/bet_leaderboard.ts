import _ from 'underscore'
import moment from 'moment'

import { mongoose } from 'src/system'
import { Cooldown, ValueCache } from 'src/util/redisModels'
import { type DBCollectionSchema } from 'src/modules'

import { type BetHistory, type BetHistoryDocument } from './bet_history_mongo'
import { betLogger } from '../lib/logger'

/*
 * Ultra-optimized at the expense of having clean/consistent underlying data.
 * This leaderboard should be able to scale to infinite # of leaderboards and support infinite underlying data.
 *
 * This system is intentionally brittle so learn ye the pieces lest ye break it
 *   - the data we store is a replica of the bet object
 *   - getLeaderboardForGame builds a leaderboard for a given game identifier + leaderboard field.
 *   - getLeaderboardForGame dedupes leaderboard entries per userId per time period
 *   - getLeaderboardForGame also cleans up leaderboard items which "fell off"
 *     the leaderboard after processing (check the unusedIds var)
 *   - getLeaderboardForGame also stores the minimum value on the leaderboard for all time periods
 *     which is called the recordingCutoff
 *   - recordBetLeaderboard is called via a hook
 *   - it queries the recording cutoff and if the bet exceeds that, it stores the bet on the leaderboard
 *   - the next time the leaderboard is processed, any leaderboard items which are now invalid (by timestamp
 *     or by being knocked off the leaderboard) will be deleted.
 */

type BetLeaderboardTimeFrame = 'alltime' | 'month' | 'week' | 'day'
export type BetLeaderboardType = BetHistoryDocument & {
  leaderboardField: string
}
export type LeaderboardResponse = Record<
  BetLeaderboardTimeFrame,
  BetLeaderboardType[]
>
export type LeaderboardField = 'payoutValue' | 'mult'

const LEADERBOARD_BET_AMOUNT_CUTOFF = 0.2
const LEADERBOARD_DOC_COUNT = 3
const LEADERBOARD_TIME_WINDOWS: Record<
  BetLeaderboardTimeFrame,
  { tsBack: number }
> = {
  alltime: { tsBack: 60 * 60 * 24 * 7 * 30 * 12 * 10 },
  month: { tsBack: 60 * 60 * 24 * 7 * 30 },
  week: { tsBack: 60 * 60 * 24 * 7 },
  day: { tsBack: 60 * 60 * 24 * 1 },
}

const BetLeaderboardSchema = new mongoose.Schema<BetLeaderboardType>(
  {
    leaderboardField: String,
    gameIdentifier: String,
    payoutValue: Number,
    // temporary default value
    currency: { type: String, default: 'usd' },
    mult: Number,
    userId: String,
  },
  // We do not want strict: false in more collections, don't follow this pattern.
  { strict: false, timestamps: true },
)
BetLeaderboardSchema.index({ gameIdentifier: 1, leaderboardField: 1 })

const BetLeaderboardModel = mongoose.model<BetLeaderboardType>(
  'bet_leaderboards',
  BetLeaderboardSchema,
)

const getIds = (leaderboardList: BetLeaderboardType[]): string[] =>
  leaderboardList.map(({ _id }) => _id)

export async function getLeaderboardForGame(
  gameIdentifier: string | undefined,
  leaderboardField: LeaderboardField = 'payoutValue',
): Promise<LeaderboardResponse> {
  const rawLeaderboard: BetLeaderboardType[] = await BetLeaderboardModel.find({
    gameIdentifier,
    leaderboardField,
  }).lean()
  let usedIds: string[] = []
  // processedLeaderboard is a list of leaderboard items keyed by time period
  const processedLeaderboard: LeaderboardResponse = {
    alltime: [],
    month: [],
    week: [],
    day: [],
  }

  for (const [timeWindowLabel, { tsBack }] of Object.entries(
    LEADERBOARD_TIME_WINDOWS,
  )) {
    const leaderboardForTimeWindow = rawLeaderboard.filter(
      ({ createdAt }) =>
        moment(createdAt) > moment().subtract(tsBack, 'seconds'),
    )

    const getBestBetForUser = (
      betsForUser: BetLeaderboardType[],
    ): BetLeaderboardType =>
      _.chain(betsForUser)
        .sortBy(b => -(b[leaderboardField] ?? 0))
        .value()[0]

    // get #1 entry per user in the time window - dedupe
    const bestBetPerUser = _.chain(leaderboardForTimeWindow)
      .groupBy('userId')
      .map(getBestBetForUser)
      .value()

    const tieBreakerField = leaderboardField === 'mult' ? 'payoutValue' : 'mult'

    // get top N documents out of the deduped user list
    const topLeaderboard = _.chain(bestBetPerUser)
      .sortBy(b => -moment(b.createdAt).valueOf())
      .sortBy(b => -(b[tieBreakerField] ?? 0))
      .sortBy(b => -(b[leaderboardField] ?? 0))
      .first(LEADERBOARD_DOC_COUNT)
      .value()

    // Keep track of ids which are used in the leaderboard overall so we can delete unused ones later
    usedIds = [...usedIds, ...getIds(topLeaderboard)]
    processedLeaderboard[timeWindowLabel as BetLeaderboardTimeFrame] =
      topLeaderboard
  }

  // Smallest bet which is still in the leaderboard is the recording cutoff this means any new bet above the cutoff
  // will be recorded and processed in future leaderboards. We don't really care about day, but we only need to beat
  // lowest bet in the last week to make it to leaderboard.
  const smallestBet =
    processedLeaderboard.week.length < LEADERBOARD_DOC_COUNT
      ? LEADERBOARD_BET_AMOUNT_CUTOFF
      : _.chain(processedLeaderboard.week)
          .map(leaderboard => leaderboard[leaderboardField])
          .min()
          .value()

  setRecordingCutoff(
    gameIdentifier,
    leaderboardField,
    smallestBet && smallestBet !== Infinity
      ? smallestBet
      : LEADERBOARD_BET_AMOUNT_CUTOFF,
  )

  // Calculate unused bets that fell off the leaderboard and delete them. This is the thing which actually prevents
  // the leaderboard from growing over time.
  const unusedIds = _.difference(getIds(rawLeaderboard), usedIds)
  await BetLeaderboardModel.deleteMany({
    _id: {
      $in: unusedIds,
    },
  })

  return processedLeaderboard
}

export async function setRecordingCutoff(
  gameIdentifier: string | undefined,
  leaderboardField: LeaderboardField,
  cutoff: number,
) {
  await ValueCache.set(
    'recordingCutoff',
    `${gameIdentifier}:${leaderboardField}`,
    cutoff,
    60 * 60 * 24 * 7,
  )
}

/**
 * Attempts to get recording cutoff from cache if it doesn't exist in cache it processes the leaderboard which has
 * the side effect of setting it in cache
 */
export async function getRecordingCutoff(
  gameIdentifier: string | undefined,
  leaderboardField: LeaderboardField,
): Promise<number> {
  const cutoff = await ValueCache.get(
    'recordingCutoff',
    `${gameIdentifier}:${leaderboardField}`,
  )
  if (cutoff && cutoff !== Infinity) {
    return cutoff
  }

  // Has the side effect of setting the cutoff - in case it hasn't been called recently we must call directly.
  await getLeaderboardForGame(gameIdentifier, leaderboardField)
  const cutoffUpdated = await ValueCache.get(
    'recordingCutoff',
    `${gameIdentifier}:${leaderboardField}`,
  )
  if (!cutoffUpdated || cutoffUpdated == Infinity) {
    return LEADERBOARD_BET_AMOUNT_CUTOFF
  }
  return cutoffUpdated
}

/**
 * Record bet onto the leaderboard if it exceeds the cutoff for the given leaderboard field
 */
export async function recordBetLeaderboardField(
  bet: BetHistory,
  leaderboardField: LeaderboardField,
) {
  const cutoff = await getRecordingCutoff(bet.gameIdentifier, leaderboardField)
  if ((bet[leaderboardField] ?? 0) >= cutoff) {
    await BetLeaderboardModel.create({
      leaderboardField,
      ...bet,
    })

    if ((bet[leaderboardField] ?? 0) > cutoff) {
      await Cooldown.processFunctionOnCooldown(
        `regenerateLeaderboard:${bet.gameIdentifier}:${leaderboardField}`,
        60,
        async () =>
          await getLeaderboardForGame(bet.gameIdentifier, leaderboardField),
      )
    }
  }
}

/**
 * This is a bet hook
 * @param bet Not all bets that come through here are the same format. some are mongo bets, some are rethink bets, some
 * are not even persisted to a db yet. Beware disparate bet formats!
 */
export async function recordBetLeaderboard(bet: BetHistory) {
  if (!bet.won || bet.betAmount < LEADERBOARD_BET_AMOUNT_CUTOFF) {
    return
  }
  const logger = betLogger('recordBetLeaderboard', { userId: bet.userId })
  // this is important because the bet objects we get from game providers use r.now()
  // which cannot be recorded in mongo - if you delete this line the app will crash with no stack trace on prod.
  // bets that come from non house games don't have mult.
  // @ts-expect-error, this is a required field but we delete it
  delete bet.timestamp

  if (!bet.mult) {
    bet.mult = (bet.payoutValue ?? 0) / bet.betAmount
  }
  try {
    await recordBetLeaderboardField(bet, 'payoutValue')
  } catch (error) {
    logger.error('payoutValue', { bet }, error)
  }

  try {
    await recordBetLeaderboardField(bet, 'mult')
  } catch (error) {
    logger.error('mult', { bet }, error)
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: BetLeaderboardModel.collection.name,
}
