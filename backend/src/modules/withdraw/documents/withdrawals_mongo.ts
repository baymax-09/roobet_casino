import {
  type SortOrder,
  type PipelineStage,
  type FilterQuery,
  Types,
  type ClientSession,
} from 'mongoose'

import { megaloMongo } from 'src/system'
import { schema as CashWithdrawalTransactionsSchema } from 'src/vendors/paymentiq/documents/cash_withdrawal_transactions'
import {
  publishUserWithdrawalMessageToFastTrack,
  FASTTRACK_WITHDRAWAL_FIELDS,
  validFastTrackUpdateField,
} from 'src/vendors/fasttrack'
import { mongoChangeFeedHandler } from 'src/util/mongo'
import { type DBCollectionSchema } from 'src/modules'
import { type User } from 'src/modules/user/types'
import { type WithdrawalInfo } from 'src/vendors/fasttrack/types'

import {
  type WithdrawalPluginType,
  type WithdrawStatus,
  type WithdrawalRequest,
  WithdrawStatusEnum,
  WithdrawalPluginTypes,
  type CryptoWithdrawal,
  PluginToCryptoNetwork,
} from '../types'
import { withdrawLogger } from '../lib/logger'

interface PaginatedWithdrawalArgs {
  userId: string
  limit?: number
  sort?: 1 | -1
  page?: number
  startDate?: string
  endDate?: string
  sortKey?: string
  filter?: FilterQuery<WithdrawalMongo>
}

export interface WithdrawalMongo extends CryptoWithdrawal {
  createdAt?: Date
  updatedAt?: Date
}

/*
 * I'm using this type to simplify the GQL `Withdrawal` type so we can build it incrementally.
 */
export type DBWithdrawal = Omit<WithdrawalMongo, 'request' | 'meta'>

const WithdrawalsMongoSchema = new megaloMongo.Schema<WithdrawalMongo>(
  {
    attempts: { type: Number, default: 0 },
    plugin: { type: String, index: true },
    network: { type: String },
    totalValue: { type: Number },
    userId: { type: String, index: true },
    status: { type: String, index: true },
    currency: { type: String },
    request: {},
    cashout: { type: Boolean },
    transactionId: { type: String, index: true },
    reason: { type: String },
  },
  // We do not want strict: false in more collections, don't follow this pattern.
  { strict: false, timestamps: true },
)

WithdrawalsMongoSchema.index({ status: 1, plugin: 1 })
WithdrawalsMongoSchema.index({ userId: 1, status: 1, plugin: 1 })
WithdrawalsMongoSchema.index({ userId: 1, createdAt: 1, status: 1 })

export const WithdrawalsMongo = megaloMongo.model<WithdrawalMongo>(
  'withdrawals_mongos',
  WithdrawalsMongoSchema,
)

export async function getWithdrawal(
  id: string,
): Promise<WithdrawalMongo | null> {
  return await WithdrawalsMongo.findOne({ _id: id }).exec()
}

export async function getWithdrawalByTransactionHash(
  transactionHash: string,
): Promise<WithdrawalMongo | null> {
  return await WithdrawalsMongo.findOne({
    transactionId: transactionHash,
  }).exec()
}

export async function getPendingWithdrawals(): Promise<WithdrawalMongo[]> {
  return await WithdrawalsMongo.find({
    status: WithdrawStatusEnum.PENDING,
    plugin: { $in: WithdrawalPluginTypes },
  }).exec()
}

function getFlaggedWithdrawalAggregation({
  userId,
}: {
  userId?: string
}): PipelineStage[] {
  const aggregation: PipelineStage[] = [
    {
      $match: {
        ...(userId && { userId }),
        status: WithdrawStatusEnum.FLAGGED,
        plugin: { $in: WithdrawalPluginTypes },
      },
    },
  ]
  return aggregation
}

export async function getFlaggedWithdrawalsCount({
  userId,
}: {
  userId?: string
}): Promise<number> {
  const aggregation = getFlaggedWithdrawalAggregation({ userId })
  aggregation.push({ $count: 'count' })
  return (await WithdrawalsMongo.aggregate(aggregation))[0]?.count ?? 0
}

export async function getFlaggedWithdrawals({
  userId,
}: {
  userId?: string
}): Promise<WithdrawalMongo[]> {
  const aggregation = getFlaggedWithdrawalAggregation({ userId })
  return await WithdrawalsMongo.aggregate(aggregation)
}

export async function createWithdrawal(
  user: User,
  request: WithdrawalRequest,
): Promise<WithdrawalMongo> {
  // TODO temporary and will be removed when TRC20 is released
  const network = PluginToCryptoNetwork[request.plugin]
  const payload: Omit<
    CryptoWithdrawal,
    '_id' | 'id' | 'transactionId' | 'timestamp'
  > = {
    attempts: 0,
    userId: user.id,
    request,
    plugin: request.plugin,
    network,
    totalValue: request.totalValue,
    status: WithdrawStatusEnum.INITIATED,
    currency: 'usd',
  }

  return await WithdrawalsMongo.create(payload)
}

export async function updateWithdrawal(
  id: Types.ObjectId | string,
  payload: Partial<
    Pick<CryptoWithdrawal, 'attempts' | 'status' | 'transactionId' | 'reason'>
  >,
  session?: ClientSession,
): Promise<WithdrawalMongo | null> {
  return await WithdrawalsMongo.findOneAndUpdate(
    { _id: id },
    { $set: payload },
    { ...(session && { session }) },
  ).exec()
}

export async function bulkUpdateWithdrawalStatus(
  ids: string[],
  status: WithdrawStatus,
): Promise<void> {
  await WithdrawalsMongo.updateMany({ _id: { $in: ids } }, { status }).exec()
}

export async function updateWithdrawalStatus(
  id: string,
  status: WithdrawStatus,
  reason?: string,
  session?: ClientSession,
): Promise<WithdrawalMongo | null> {
  return await WithdrawalsMongo.findOneAndUpdate(
    { _id: id },
    { status, reason },
    { ...(session && { session }), new: true },
  ).exec()
}

export async function updatePendingWithdrawalStatus(
  id: string,
  status: WithdrawStatus,
): Promise<WithdrawalMongo | null> {
  return await WithdrawalsMongo.findOneAndUpdate(
    { _id: id, status: WithdrawStatusEnum.PENDING },
    { status },
    { new: true },
  )
}

export async function getStaleCryptoWithdraws(): Promise<WithdrawalMongo[]> {
  const timeSince = 1000 * 60 * 10

  return await WithdrawalsMongo.find({
    status: {
      $in: [WithdrawStatusEnum.REPROCESSING, WithdrawStatusEnum.PROCESSING],
    },
    updatedAt: { $lte: new Date(Date.now() - timeSince) },
  })
}

export async function sumCryptoWithdrawalsInTimePeriod(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<number> {
  const sumDoc = await WithdrawalsMongo.aggregate([
    {
      $match: {
        userId,
        status: {
          $nin: [
            WithdrawStatusEnum.CANCELLED,
            WithdrawStatusEnum.FAILED,
            WithdrawStatusEnum.DECLINED,
          ],
        },
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        summedTotalValue: {
          $sum: '$totalValue',
        },
      },
    },
  ])

  return sumDoc[0]?.summedTotalValue ?? 0
}

export async function getWithdrawsBetweenDates(
  startDate: Date,
  endDate: Date,
  plugins?: WithdrawalPluginType[],
): Promise<WithdrawalMongo[]> {
  return await WithdrawalsMongo.find({
    createdAt: { $gte: startDate, $lte: endDate },
    plugin: { $in: plugins },
  }).sort({ createdAt: -1 })
}

export const getMostRecentWithdrawal = async (
  userId: string,
): Promise<WithdrawalMongo | undefined> => {
  return (
    await WithdrawalsMongo.find({
      userId,
      status: WithdrawStatusEnum.COMPLETED,
    })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean()
  )[0]
}

export const getPaginatedWithdrawals = async ({
  userId,
  limit = 25,
  page = 0,
  sort = -1,
  startDate,
  endDate,
  sortKey = 'createdAt',
  filter,
}: PaginatedWithdrawalArgs) => {
  const payload: FilterQuery<WithdrawalMongo> = {
    ...filter,
    userId,
  }

  if (startDate && endDate) {
    payload.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    }
  }

  const aggregationSteps = [
    { $match: payload },
    {
      $unionWith: {
        coll: CashWithdrawalTransactionsSchema.name,
        pipeline: [{ $match: payload }],
      },
    },
  ]

  // I know this looks bad, Mongo recommends using $facet but there are known efficiency problems with large data sets
  const [data, count] = await Promise.all([
    WithdrawalsMongo.aggregate([
      ...aggregationSteps,
      { $sort: { [sortKey]: sort } },
      { $skip: page * limit },
      { $limit: limit },
    ]).exec(),
    WithdrawalsMongo.aggregate([
      ...aggregationSteps,
      { $count: 'count' },
    ]).exec(),
  ])

  return { data, count: count[0]?.count ?? 0, page, limit }
}

/**
 * @deprecated Use getPaginatedWithdrawals instead.
 */
export async function tableSearchWithdrawals(
  limit = 25,
  page = 0,
  sortObj: Record<string, SortOrder> = { timestamp: -1 },
  filterObj: FilterQuery<CryptoWithdrawal> = {},
  requestingUserId: string,
) {
  const query = () => WithdrawalsMongo.find(filterObj).sort(sortObj)

  return {
    page,
    limit,
    count: await query().countDocuments(),
    data: (
      await query()
        .limit(limit)
        .skip(page * limit)
    ).filter(
      row => !row.cashout || (row.cashout && requestingUserId === row.userId),
    ),
  }
}

/* FEEDS */
const withdrawalsChangeFeed = async () => {
  let logUserId = null
  try {
    await mongoChangeFeedHandler<WithdrawalMongo>(
      WithdrawalsMongo,
      async document => {
        if (
          document.fullDocument &&
          validFastTrackUpdateField(document, FASTTRACK_WITHDRAWAL_FIELDS)
        ) {
          const { _id, status, totalValue, userId, currency } =
            document.fullDocument

          logUserId = userId
          const withdrawal: WithdrawalInfo = {
            currency,
            status,
            amount: totalValue,
            paymentId: _id,
            userId,
            vendorId: 'inhouse',
          }
          await publishUserWithdrawalMessageToFastTrack({
            withdrawal,
          })
        }
      },
    )
  } catch (error) {
    withdrawLogger('withdrawlsChangeFeed', { userId: logUserId }).error(
      'There was an error in the withdrawals change feed',
      {},
      error,
    )
  }
}

/**
 * Resets the status of a failed withdrawal to pending.
 *
 * @param {string} transactionId - Id of the transaction to reset.
 * @param {ClientSession} [session] - Optional session for the MongoDB operation.
 * @returns {Promise<WithdrawalMongo | null>}
 * A promise that resolves to the updated withdrawal document, or null if no matching document was found.
 * @throws {Error} - Throws an error if the operation fails.
 */
export async function resetFailedWithdrawal(
  transactionId: string,
  session?: ClientSession,
): Promise<WithdrawalMongo | null> {
  return await WithdrawalsMongo.findOneAndUpdate(
    {
      _id: new Types.ObjectId(transactionId),
      status: WithdrawStatusEnum.FAILED,
    },
    { status: WithdrawStatusEnum.PENDING },
    { ...(session && { session }) },
  ).exec()
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: WithdrawalsMongo.collection.name,
  feeds: [withdrawalsChangeFeed],
}
