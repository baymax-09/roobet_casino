import moment from 'moment'
import {
  type FilterQuery,
  type UpdatePayload,
  type Document,
  type Types,
  type PipelineStage,
} from 'mongoose'

import { megaloMongo, megaloMongoAnalytics } from 'src/system/mongo'
import { type HouseGameName } from 'src/modules/game/types'
import { publishUserGameRoundMessageToFastTrack } from 'src/vendors/fasttrack'
import { mongoChangeFeedHandler } from 'src/util/mongo'
import { type DBCollectionSchema } from 'src/modules'

import * as BetLeaderboard from './bet_leaderboard'

import { betLogger } from '../lib/logger'
import { type BetHistory as BetHistoryRethink } from '../types/Bet'
import { ThirdParties } from '../types'

// TODO: This type should not extend the rethink collection, nor the
// active bet interface. They should be separate interfaces entirely.
export interface BetHistory extends BetHistoryRethink {
  timestamp: Date
}

// Here we are omitting the mongoose 'id' getter since there is already
// much confusion around bets, active bets, and bet histories.
export type BetHistoryDocument = Omit<
  BetHistory &
    Document & {
      createdAt: Date
      updatedAt: Date
    },
  'id'
>

// TODO: Most of these fields should be required. Organize by required
// and optional & game-specific.
const BetHistorySchema = new megaloMongo.Schema<BetHistoryDocument>(
  {
    // Bet amount + currency pair.
    betAmount: { type: Number },
    balanceType: { type: String },
    // Temporary default value. The default should be removed
    // when we support multiple currencies.
    currency: { type: String, default: 'usd' },

    // Closeout statuses.
    closedOut: { type: Boolean, required: true, default: true },
    closeoutComplete: { type: Boolean, required: true, default: true },
    paidOut: { type: Boolean, required: true, default: true },
    ranHooks: { type: Boolean, required: true, default: true },
    attempts: { type: Number, required: true, default: 1 },
    closeoutTimestamp: { type: Date, required: true, default: Date.now },

    cashoutCrashPoint: { type: Number },

    // Id of house game ID. Kinda doubt we need this but who knows.
    gameId: { type: String },

    // Reference to active bet id.
    betId: { type: String },

    // This should be replaced by gameIdentifier, where housegames
    // have an identifier of a 'gameName'.
    gameName: { type: String },

    // Display name of game. Used on the frontend to reduce unnecessary joins.
    gameNameDisplay: { type: String },

    // Only used for Softswiss. Purely record keeping.
    transactionIds: { type: [String] },

    // Hides author information.
    incognito: { type: Boolean },

    // Hides author information.
    highroller: { type: Boolean },

    // Provider, aggregator, etc.
    thirdParty: { type: String, enum: ThirdParties },

    // Arbitrary game category. Not sure this is read anywhere.
    category: { type: String },

    betSelection: { type: Number },
    winningNumber: { type: Number },

    // Provably fair.
    roundId: { type: String },
    clientSeed: { type: String },
    nonce: { type: Number },
    hash: { type: String },

    gameIdentifier: { type: String },

    payoutValue: { type: Number },

    mult: { type: Number },
    profit: { type: Number },

    // Whether or not the user has TFA or a verified email.
    twoFactor: { type: Boolean },

    // Display map for the author.
    user: {
      type: {
        id: { type: String },
        name: { type: String },
      },
    },

    // This varies massively across providers. The 'betId' field
    // is most likely more useful.
    gameSessionId: { type: String },

    userId: { type: String },
    won: { type: Boolean },

    // I'd love to remove this too, but we first need to migrate off
    // the rethink collection. This timestamp may vary massively from
    // the `createdAt` field due to how we close out bets currently.
    timestamp: { type: Date },
  },
  { strict: false, timestamps: true },
)

BetHistorySchema.index({ gameId: 1 })
BetHistorySchema.index({ userId: 1 })
BetHistorySchema.index({ betId: 1 })
BetHistorySchema.index({ timestamp: 1 })
BetHistorySchema.index({ updatedAt: 1 }, { sparse: true })

// We keep 6 months of bet history in our persistent store.
// The expired documents are available in the data warehouse.
BetHistorySchema.index(
  { updatedAt: 1 },
  { expires: '180d', name: 'updatedAt_1_ttl' },
)

export const BetHistoryModel = megaloMongo.model<BetHistoryDocument>(
  'bet_history_mongos',
  BetHistorySchema,
)
export const BetHistoryAnalyticsModel =
  megaloMongoAnalytics.model<BetHistoryDocument>(
    'bet_history_mongos',
    BetHistorySchema,
  )

export function ensureIncognitoState(
  entries: BetHistoryDocument[],
): BetHistoryDocument[] {
  return entries.map(entry =>
    entry.incognito ? { ...entry, user: null, userId: 'incognito' } : entry,
  )
}

export async function updateBetHistoryForGame(
  gameId: string,
  updatePayload: UpdatePayload<BetHistory>,
) {
  await BetHistoryModel.updateMany({ gameId }, updatePayload)
}

export async function recordAndReturnBetHistory(
  bet: BetHistory,
): Promise<BetHistoryDocument> {
  const payload: BetHistory = {
    ...bet,
    mult:
      bet.payoutValue && bet.betAmount ? bet.payoutValue / bet.betAmount : 0,
    timestamp: new Date(),
  }

  const results = await BetHistoryModel.create(payload)

  return await results.toObject()
}

export async function hideBetHistory(userId: string): Promise<void> {
  await BetHistoryModel.updateMany({ userId }, { hidden: true })
}

/** I think this is wrong */
export async function updateBetHistoryById(
  betId: string | Types.ObjectId,
  update: UpdatePayload<BetHistory>,
): Promise<void> {
  await BetHistoryModel.findByIdAndUpdate(betId, update)
}

export async function getBetById(
  betId: string,
): Promise<BetHistoryDocument | null> {
  return await BetHistoryModel.findById(betId).lean()
}

/** Returns the bet from the active bet ID */
export async function getBetByBetId(
  betId: string,
): Promise<BetHistoryDocument | null> {
  return await BetHistoryModel.findOne({ betId }).lean()
}

export async function getBetsByGameId(
  gameId: string,
  gameName: HouseGameName,
): Promise<BetHistoryDocument[]> {
  return await BetHistoryModel.find({ gameId, gameName }).lean()
}

export async function getBetsByGameIdWon(
  gameId: string,
  gameName: HouseGameName,
  won: boolean,
): Promise<BetHistoryDocument[]> {
  return await BetHistoryModel.find({ gameId, gameName, won }).lean()
}

export async function getUserHistoryForGame(
  userId: string,
  gameName: HouseGameName,
): Promise<BetHistoryDocument[]> {
  gameName = gameName || ''
  return await BetHistoryModel.find({ userId, gameName }, null, {
    limit: 50,
    sort: { timestamp: -1 },
  }).lean()
}

export async function getRecentBetHistory(
  limit = 25,
  page = 0,
): Promise<BetHistoryDocument[]> {
  return await BetHistoryModel.find({ twoFactor: true })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(page * limit)
    .lean()
}

export async function tableSearchBets(
  limit = 25,
  page = 0,
  sortObj: Record<string, any> = { timestamp: -1 },
  filterObj: FilterQuery<BetHistoryDocument> = {},
) {
  const query = () => BetHistoryModel.find(filterObj).sort(sortObj)

  return {
    page,
    limit,
    count: await query().countDocuments(),
    data: await query()
      .limit(limit)
      .skip(page * limit)
      .lean(),
  }
}

export async function getRecentBetHistoryForUser(
  userId: string,
  limit = 25,
  page = 0,
): Promise<BetHistoryDocument[]> {
  return await BetHistoryModel.find({ userId }, null, {
    limit,
    sort: { timestamp: -1 },
  })
    .skip(page * limit)
    .lean()
}

export async function getBetHistoryForUser(
  userId: string,
): Promise<BetHistoryDocument[]> {
  return await BetHistoryModel.find({ userId }, null, {
    sort: { timestamp: -1 },
  }).lean()
}

export async function getBetActivityForUser(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<any[]> {
  const aggregation: PipelineStage[] = [
    {
      $match: {
        userId,
        timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) },
        closedOut: true,
      },
    },
    {
      $group: {
        _id: '$gameIdentifier',
        title: { $first: '$gameNameDisplay' },
        gameName: { $first: '$gameName' },
        wagers: { $sum: 1 },
        wagered: { $sum: '$betAmount' },
        payout: { $sum: '$payoutValue' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        identifier: '$_id',
        title: 1,
        gameName: 1,
        wagers: 1,
        wagered: 1,
        avgWager: { $divide: ['$wagered', '$wagers'] },
        payout: 1,
        ggr: { $subtract: ['$wagered', '$payout'] },
      },
    },
    {
      $sort: { wagered: -1 },
    },
  ]

  return await BetHistoryAnalyticsModel.aggregate(aggregation)
}

export async function getMostPlayedGameForUser(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<BetHistoryDocument | null> {
  const games = await BetHistoryModel.aggregate([
    {
      $match: {
        userId,
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: '$gameIdentifier',
        gameName: { $first: '$gameName' },
        gameNameDisplay: { $first: '$gameNameDisplay' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
    {
      $limit: 1,
    },
  ])
  return games.length ? games[0] : null
}

export async function getHighRollers(): Promise<BetHistoryDocument[]> {
  return await BetHistoryModel.find({
    twoFactor: true,
    timestamp: {
      $gte: moment().subtract(1, 'day').toISOString(),
    },
    payoutValue: {
      $gte: 100,
    },
  })
    .sort({ timestamp: -1 })
    .limit(25)
    .lean()
}

export async function getLuckyWins(): Promise<BetHistoryDocument[]> {
  return await BetHistoryModel.find({
    twoFactor: true,
    timestamp: {
      $gte: moment().subtract(1, 'day').toISOString(),
    },
    mult: {
      $gte: 25,
    },
    betAmount: {
      $gte: 0.1,
    },
  })
    .sort({ timestamp: -1 })
    .limit(25)
    .lean()
}

export const getLuckiestRecentBets = async (gameIdentifier: string) => {
  return await BetLeaderboard.getLeaderboardForGame(gameIdentifier, 'mult')
}

export const getBiggestRecentBets = async (gameIdentifier: string) => {
  return await BetLeaderboard.getLeaderboardForGame(
    gameIdentifier,
    'payoutValue',
  )
}

export const getIncompleteClosedOutBets = async (
  hoursBack = 5,
): Promise<BetHistoryDocument[]> => {
  const now = Date.now()

  return await BetHistoryModel.find({
    closeoutComplete: false,
    closeoutTimestamp: {
      // X hours.
      $gte: now - hoursBack * 60 * 60 * 1000,
      // 60 seconds.
      $lte: now - 60 * 1000,
    },
  }).lean()
}

/* FEEDS */
const betHistoryChangeFeed = async () => {
  try {
    await mongoChangeFeedHandler<BetHistoryDocument>(
      BetHistoryModel,
      async document => {
        if (document.fullDocument) {
          await publishUserGameRoundMessageToFastTrack({
            bet: document.fullDocument,
          })
        }
      },
    )
  } catch (error) {
    betLogger('betHistoryChangeFeed', { userId: null }).error(
      'There was an error in the bet history change feed',
      {},
      error,
    )
  }
}
export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: BetHistoryModel.collection.name,
  feeds: [betHistoryChangeFeed],
}
