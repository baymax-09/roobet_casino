import { type Document, type FilterQuery } from 'mongoose'

import { DepositStatuses } from 'src/modules/deposit/types'
import { megaloMongo } from 'src/system'
import { mongoChangeFeedHandler } from 'src/util/mongo'
import { type DBCollectionSchema } from 'src/modules'
import { type DepositInfo } from 'src/vendors/fasttrack/types'
import {
  FASTTRACK_DEPOSIT_FIELDS,
  validFastTrackUpdateField,
  publishUserDepositMessageToFastTrack,
} from 'src/vendors/fasttrack'

import {
  type ProviderResponse,
  type CashDepositTransaction,
  type PaymentProvider,
} from '../types'
import { piqLogger } from '../lib/logger'

interface PaginationArgs {
  userId: string
  sort?: Record<string, 1 | -1> | undefined
  startDate?: string
  endDate?: string
  provider?: PaymentProvider
  limit?: number
  page?: number
  filter?: FilterQuery<CashDepositTransaction>
}

const ProviderResponseSchema = new megaloMongo.Schema<ProviderResponse>({
  statusCode: { type: String },
  pspStatusCode: { type: String },
  pspStatusMessage: { type: String },
  info: { type: String },
})

export type CashDepositTransactionWithDocument = CashDepositTransaction &
  Document
const CashDepositTransactionsSchema =
  new megaloMongo.Schema<CashDepositTransactionWithDocument>(
    {
      userId: { type: String, index: true },
      provider: { type: String },
      paymentMethod: { type: String },
      amount: { type: Number },
      currency: { type: String },
      externalId: { type: String, index: true, unique: true },
      status: {
        type: String,
        enum: DepositStatuses,
        index: true,
        default: 'initiated',
      },
      reason: { type: String },
      originTxId: { type: String },
      providerResponse: { type: ProviderResponseSchema },
    },
    { timestamps: true },
  )

CashDepositTransactionsSchema.index({ userId: 1, status: 1 })
CashDepositTransactionsSchema.index({ userId: 1, provider: 1 })
CashDepositTransactionsSchema.index({ userId: 1, createdAt: 1, status: 1 })

const CashDepositTransactions =
  megaloMongo.model<CashDepositTransactionWithDocument>(
    'cash_deposit_transactions',
    CashDepositTransactionsSchema,
  )

export async function createCashDepositTransaction(
  payload: CashDepositTransaction,
) {
  return await CashDepositTransactions.create(payload)
}

export async function updateCashDepositTransaction(
  id: string,
  update: Partial<CashDepositTransaction>,
) {
  return await CashDepositTransactions.findOneAndUpdate({ _id: id }, update)
}

export async function updateCashDepositTransactionByExternalId(
  externalId: string,
  update: Partial<CashDepositTransaction>,
) {
  return await CashDepositTransactions.findOneAndUpdate({ externalId }, update)
}

export async function getCashDepositTransactionByExternalId(
  externalId: string,
) {
  const cashDepositTransaction = await CashDepositTransactions.findOne({
    externalId,
  })

  return cashDepositTransaction?.toObject<CashDepositTransaction>()
}

export async function sumCashDepositsInTimePeriod(
  userId: string,
  startTime: Date,
  endTime: Date,
): Promise<number> {
  const result = await CashDepositTransactions.aggregate([
    {
      $match: {
        userId,
        status: 'completed',
        createdAt: {
          $gte: startTime,
          $lte: endTime,
        },
      },
    },
    { $group: { _id: '', totalSum: { $sum: '$amount' } } },
  ])
  return result[0]?.totalSum ?? 0
}

export async function countUserCashDepositsInTimePeriod(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<number> {
  return await CashDepositTransactions.find({
    userId,
    status: 'completed',
    createdAt: { $gte: startDate, $lte: endDate },
  }).countDocuments()
}

export async function getCashDepositTransactionsForAdmin({
  userId,
  provider,
  limit = 25,
  page = 0,
  sort = { createdAt: -1 },
  startDate,
  endDate,
  filter,
}: PaginationArgs) {
  const payload: FilterQuery<CashDepositTransaction> = {
    ...filter,
    userId,
    provider,
  }

  if (startDate && endDate) {
    payload.createdAt = {
      $gte: startDate,
      $lte: endDate,
    }
  }

  const query = () => CashDepositTransactions.find(payload)

  return {
    page,
    limit,
    count: await query().countDocuments(),
    data: await query()
      .sort(sort)
      .skip(page * limit)
      .limit(limit),
  }
}

/* FEEDS */
const cashDepositsChangeFeed = async () => {
  const logger = piqLogger('cashDepositsChangeFeed', { userId: null })
  try {
    await mongoChangeFeedHandler<CashDepositTransactionWithDocument>(
      CashDepositTransactions,
      async document => {
        if (
          document?.fullDocument &&
          validFastTrackUpdateField(document, FASTTRACK_DEPOSIT_FIELDS)
        ) {
          const { _id, currency, status, amount, userId, provider } =
            document.fullDocument
          const deposit: DepositInfo = {
            currency,
            status,
            amount,
            paymentId: _id,
            userId,
            vendorId: provider,
          }

          await publishUserDepositMessageToFastTrack({
            deposit,
          })
        }
      },
    )
  } catch (error) {
    logger.error(
      'There was an error in the cash deposits change feed',
      {},
      error,
    )
  }
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: CashDepositTransactions.collection.name,
  feeds: [cashDepositsChangeFeed],
}
