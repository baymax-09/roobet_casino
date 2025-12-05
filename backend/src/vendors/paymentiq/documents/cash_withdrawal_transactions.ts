import { type FilterQuery, type Document } from 'mongoose'

import { megaloMongo } from 'src/system'
import {
  WithdrawStatusEnum,
  WithdrawStatuses,
} from 'src/modules/withdraw/types'
import {
  publishUserWithdrawalMessageToFastTrack,
  FASTTRACK_WITHDRAWAL_FIELDS,
  validFastTrackUpdateField,
} from 'src/vendors/fasttrack'
import { mongoChangeFeedHandler } from 'src/util/mongo'
import { type DBCollectionSchema } from 'src/modules'
import { type WithdrawalInfo } from 'src/vendors/fasttrack/types'

import {
  type ProviderResponse,
  type CashWithdrawalTransaction,
  type PaymentProvider,
} from '../types'
import { piqLogger } from '../lib/logger'

interface PaginationArgs {
  userId: string
  provider?: PaymentProvider
  limit?: number
  page?: number
  sort?: 1 | -1
  startDate?: string
  endDate?: string
  filter?: FilterQuery<CashWithdrawalTransaction>
}

const ProviderResponseSchema = new megaloMongo.Schema<ProviderResponse>({
  statusCode: { type: String },
  pspStatusCode: { type: String },
  pspStatusMessage: { type: String },
  info: { type: String },
})

type CashWithdrawalTransactionWithDocument = CashWithdrawalTransaction &
  Document

const CashWithdrawalTransactionsSchema =
  new megaloMongo.Schema<CashWithdrawalTransactionWithDocument>(
    {
      userId: { type: String, index: true },
      provider: { type: String },
      paymentMethod: { type: String },
      amount: { type: Number },
      currency: { type: String },
      externalId: { type: String, index: true, unique: true },
      status: {
        type: String,
        enum: WithdrawStatuses,
        index: true,
        default: WithdrawStatusEnum.INITIATED,
      },
      reason: { type: String },
      originTxId: { type: String },
      providerResponse: { type: ProviderResponseSchema },
    },
    { timestamps: true },
  )

CashWithdrawalTransactionsSchema.index({ userId: 1, status: 1 })
CashWithdrawalTransactionsSchema.index({ userId: 1, createdAt: 1, status: 1 })

const CashWithdrawalTransactions =
  megaloMongo.model<CashWithdrawalTransactionWithDocument>(
    'cash_withdrawal_transactions',
    CashWithdrawalTransactionsSchema,
  )

export async function createCashWithdrawalTransaction(
  payload: CashWithdrawalTransaction,
) {
  const cashWithdrawalTransaction =
    await CashWithdrawalTransactions.create(payload)

  return cashWithdrawalTransaction?.toObject<CashWithdrawalTransaction>()
}

export async function updateCashWithdrawalTransaction(
  id: string,
  update: Partial<CashWithdrawalTransaction>,
) {
  return await CashWithdrawalTransactions.findOneAndUpdate({ _id: id }, update)
}

export async function updateCashWithdrawalTransactionByExternalId(
  externalId: string,
  update: Partial<CashWithdrawalTransaction>,
) {
  return await CashWithdrawalTransactions.findOneAndUpdate(
    { externalId },
    update,
  )
}

export async function sumCashWithdrawalsInTimePeriod(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<number> {
  const sumDoc = await CashWithdrawalTransactions.aggregate([
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
        summedTotalAmount: {
          $sum: '$amount',
        },
      },
    },
  ])

  return sumDoc[0]?.summedTotalAmount ?? 0
}

export async function getCashWithdrawalTransactionsForAdmin({
  userId,
  provider,
  limit = 25,
  page = 0,
  sort = -1,
  startDate,
  endDate,
  filter,
}: PaginationArgs) {
  const payload: FilterQuery<CashWithdrawalTransaction> = {
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

  const query = () => CashWithdrawalTransactions.find(payload)

  return {
    page,
    limit,
    count: await query().countDocuments(),
    data: await query()
      .sort({ createdAt: sort })
      .skip(page * limit)
      .limit(limit),
  }
}

/* FEEDS */
const cashWithdrawalsChangeFeed = async () => {
  try {
    await mongoChangeFeedHandler<CashWithdrawalTransactionWithDocument>(
      CashWithdrawalTransactions,
      async document => {
        if (
          document.fullDocument &&
          validFastTrackUpdateField(document, FASTTRACK_WITHDRAWAL_FIELDS)
        ) {
          const { _id, currency, status, amount, userId, provider } =
            document.fullDocument
          const withdrawal: WithdrawalInfo = {
            currency,
            status,
            amount,
            paymentId: _id,
            userId,
            vendorId: provider,
          }
          await publishUserWithdrawalMessageToFastTrack({
            withdrawal,
          })
        }
      },
    )
  } catch (error) {
    piqLogger('cashWithdrawalsChangeFeed', { userId: null }).error(
      'There was an error in the cash withdrawals change feed',
      {},
      error,
    )
  }
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: CashWithdrawalTransactions.collection.name,
  feeds: [cashWithdrawalsChangeFeed],
}
