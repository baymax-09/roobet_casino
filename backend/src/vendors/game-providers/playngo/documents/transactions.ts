import {
  type UpdateWithAggregationPipeline,
  type UpdateQuery,
  type Types,
} from 'mongoose'

import { MongoErrorCodes, mongoose } from 'src/system'
import { type Types as UserTypes } from 'src/modules/user'
import { type DBCollectionSchema } from 'src/modules'

import { playngoLogger } from '../lib/logger'
import { type StatusCode, StatusCodes } from '../lib/enums'

export type PngResponse = { statusCode: StatusCode } & Record<
  string,
  string | number | Types.ObjectId | null
>

export interface PNGTransaction {
  payload: object
  response: PngResponse
  transactionId: string
  userId: string
  attempts: number
  createdAt: Date
  updatedAt: Date
}

type PNGTransactionDocument = PNGTransaction & { _id: Types.ObjectId }

const PNGTransactionSchema = new mongoose.Schema<PNGTransactionDocument>(
  {
    payload: {
      type: mongoose.Schema.Types.Mixed,
    },
    response: {
      type: Map,
      of: String,
    },
    transactionId: { type: String, index: true, unique: true },
    userId: { type: String },
    attempts: { type: Number, default: 1 },
  },
  { timestamps: true },
)

PNGTransactionSchema.index({ updatedAt: 1 }, { expires: '3d' })

const PNGTransactionModel = mongoose.model<PNGTransactionDocument>(
  'png_transactions',
  PNGTransactionSchema,
)

const updateTransaction = async (
  id: Types.ObjectId,
  payload: Partial<Omit<PNGTransaction, '_id'>>,
): Promise<PNGTransactionDocument | null> => {
  return await PNGTransactionModel.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  }).lean()
}

/**
 * Transaction recording and idempotency check helper. Writes a transaction record
 * or finds an existing one.
 */
const touchTransaction = async (
  user: UserTypes.User,
  transactionId: string,
  payload: UpdateQuery<PNGTransaction> | UpdateWithAggregationPipeline,
): Promise<{
  transaction: PNGTransactionDocument | undefined
  existed?: boolean
}> => {
  try {
    const transaction = await PNGTransactionModel.create({
      payload,
      transactionId,
      userId: user.id,
    })

    return { transaction, existed: false }
  } catch (error) {
    if (error.code === MongoErrorCodes.DUPLICATE_KEY) {
      const existingDocument = await PNGTransactionModel.findOneAndUpdate(
        { transactionId },
        { $inc: { attempts: 1 } },
        { new: true },
      ).lean()

      return { transaction: existingDocument ?? undefined, existed: true }
    }

    return { transaction: undefined, existed: false }
  }
}

type ProcessFn<T> = (
  user: UserTypes.User,
  request: T,
  transaction?: PNGTransactionDocument,
) => Promise<PngResponse>

/**
 * Idempotent transactions for PlayNGo
 * @param processAlways is useful for cancelReserve calls which pass the transaction id of a reserve call and you need
 * to undo it. Come to think of it processAlways shouldn't have been implemented, we should have built a separate
 * function for it.
 */
export async function transactionalProcess<T extends { transactionid: string }>(
  path: string,
  user: UserTypes.User,
  request: T,
  processFunction: ProcessFn<T>,
  processAlways: boolean,
): Promise<PngResponse> {
  try {
    const { transaction, existed } = await touchTransaction(
      user,
      request.transactionid,
      request,
    )

    if (!transaction) {
      throw new Error('Failed to write or load action document.')
    }

    const transactionId = transaction._id

    // If transaction has not been processed, process and return.
    if (!existed || processAlways) {
      const response = await processFunction(user, request, transaction)

      // Write response to transaction record.
      await updateTransaction(transactionId, { response })

      // If we are force processing (cancelReserve), don't return the transactionId.
      if (processAlways) {
        return {
          ...response,
          externalTransactionId: null,
        }
      }

      return {
        ...response,
        externalTransactionId: transactionId,
      }
    }

    // If transaction has already been processed, do nothing and early return expected response.
    return {
      ...transaction.response,
      externalTransactionId: transactionId,
    }
  } catch (error) {
    playngoLogger('transactionalProcess', { userId: null }).error(
      `PNG transactionalProcess ${path}`,
      { path },
      error,
    )
    return { statusCode: StatusCodes.INTERNAL }
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: PNGTransactionModel.collection.name,
}
