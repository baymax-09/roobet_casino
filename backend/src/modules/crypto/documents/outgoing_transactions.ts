import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { type CryptoNetwork, type CryptoSymbol } from '../types'

type OutgoingTransactionStatus = 'pending' | 'completed' | 'reverted'

interface Fees {
  userFeePaid: number
  totalFeePaid: number
  userFeePaidUSD: number
  totalFeePaidUSD: number
}

interface GetOldPendingTransactionsArgs {
  networks: CryptoNetwork[]
  hours?: number
  limit?: number
}

export interface OutgoingCryptoTransaction {
  network: CryptoNetwork
  transactionHash: string
  status: OutgoingTransactionStatus
  value: number
  token: CryptoSymbol
  fees: Fees

  /** the blockHeight of the head block of the blockchain at the time the transaction is sent */
  blockSent: number | undefined
  /** the blockHeight of the block that the transaction was added to */
  blockConfirmed?: number
  /** the block hash of the block that the transaction was confirmed */
  blockHash?: string

  createdAt: Date
  updatedAt: Date
}

const OutgoingCryptoTransactionSchema =
  new megaloMongo.Schema<OutgoingCryptoTransaction>(
    {
      network: {
        type: String,
        required: true,
      },
      value: { type: Number },
      transactionHash: {
        index: true,
        required: true,
        type: String,
      },
      status: {
        default: 'pending',
        required: true,
        type: String,
        index: true,
      },
      token: {
        type: String,
        required: true,
      },
      blockSent: {
        type: Number,
        required: true,
      },
      blockConfirmed: { type: Number },
      blockHash: { type: String },
      fees: {
        type: {
          userFeePaid: {
            type: Number,
            required: true,
          },
          totalFeePaid: {
            type: Number,
            required: true,
          },
          userFeePaidUSD: {
            type: Number,
            required: true,
          },
          totalFeePaidUSD: {
            type: Number,
            required: true,
          },
        },
        required: true,
      },
    },
    { timestamps: true },
  )

OutgoingCryptoTransactionSchema.index({ network: 1, transactionHash: 1 })

const OutgoingCryptoTransactionModel =
  megaloMongo.model<OutgoingCryptoTransaction>(
    'outgoing_transactions',
    OutgoingCryptoTransactionSchema,
  )

export async function createOutgoingTransaction(
  payload: Omit<
    OutgoingCryptoTransaction,
    'createdAt' | 'updatedAt' | 'status'
  >,
) {
  return await OutgoingCryptoTransactionModel.create(payload)
}

export async function updateOutgoingTransaction(
  network: CryptoNetwork,
  transactionHash: string,
  update: Partial<OutgoingCryptoTransaction>,
) {
  return await OutgoingCryptoTransactionModel.findOneAndUpdate(
    { network, transactionHash },
    update,
    { new: true },
  )
}

export async function getAllOutgoingTransactionsOfStatus(
  status: OutgoingTransactionStatus,
) {
  return await OutgoingCryptoTransactionModel.find({ status })
}

export const updatePendingTransactionsByTransactionHashes = async (
  transactionHashes: string[],
  update: Partial<OutgoingCryptoTransaction>,
): Promise<OutgoingCryptoTransaction[]> => {
  return await OutgoingCryptoTransactionModel.updateMany(
    { status: 'pending', transactionHash: { $in: transactionHashes } },
    update,
  ).lean()
}

export const getOldPendingTransactions = async ({
  networks,
  hours,
  limit,
}: GetOldPendingTransactionsArgs): Promise<OutgoingCryptoTransaction[]> => {
  const query = OutgoingCryptoTransactionModel.find({
    status: 'pending',
    ...(networks && { network: { $in: networks } }),
    // Specify at least how old the transactions should be (eg at least 2 hours old)
    ...(hours && {
      createdAt: { $lt: new Date(Date.now() - hours * 60 * 60 * 1000) },
    }),
  })

  if (limit) {
    query.limit(limit)
  }

  query.sort({ createdAt: 1 })

  return await query.lean()
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: OutgoingCryptoTransactionModel.collection.name,
}
