import { type Types } from 'mongoose'

import { MongoErrorCodes, mongoose } from 'src/system'
import { type Types as UserTypes } from 'src/modules/user'
import { type DBCollectionSchema } from 'src/modules'

import {
  type TransactionProcessResult,
  type ProcessResult,
  type ResponsePayloads,
} from '../lib/types'
import { SeamlessWalletStatusCodes } from '../lib/enums'
import { pragmaticLogger } from '../lib/logger'

export interface Payload {
  gameId: string
  providerId: string
  roundId: string
  userId: string
  reference: string
}

export type TransactionType =
  | 'bet'
  | 'bonusWin'
  | 'endRound'
  | 'refund'
  | 'promoWin'
  | 'result'
  | 'jackpotWin'

type TransactionResp = ProcessResult<ResponsePayloads>
export interface PragmaticTransaction {
  _id: Types.ObjectId
  /** @todo make more strict based on action type */
  payload: Record<string, any>
  response: TransactionResp
  transactionId: string
  userId: string
  attempts: number
  /** @todo remove optionality after TTL cleans up all old */
  type?: TransactionType
  createdAt: Date
  updatedAt: Date
}

const PragmaticTransactionSchema = new mongoose.Schema<PragmaticTransaction>(
  {
    payload: { type: mongoose.Schema.Types.Mixed },
    response: { type: mongoose.Schema.Types.Mixed },
    transactionId: { type: String, index: true, unique: true },
    userId: { type: String },
    // TODO make required after TTL cleans up all old
    type: { type: String },
    attempts: { type: Number, default: 1, required: true },
  },
  { timestamps: true },
)

PragmaticTransactionSchema.index({ updatedAt: 1 }, { expires: '3d' })

export const PragmaticTransactionModel = mongoose.model<PragmaticTransaction>(
  'pragmatic_transactions',
  PragmaticTransactionSchema,
)

export const touchTransaction = async (
  userId: string,
  transactionId: string,
  payload: Payload,
  transactionType: TransactionType,
  /** Useful for building sentinels for pre-refunded bets. */
  response?: TransactionResp,
): Promise<{
  transaction: PragmaticTransaction | undefined
  existed?: boolean
}> => {
  try {
    const transaction = await PragmaticTransactionModel.create({
      userId,
      transactionId,
      payload,
      type: transactionType,
      ...(response ? { response } : {}),
    })
    return { transaction, existed: false }
  } catch (error) {
    if (error.code === MongoErrorCodes.DUPLICATE_KEY) {
      const transaction = await PragmaticTransactionModel.findOneAndUpdate(
        { transactionId },
        { $inc: { attempts: 1 } },
        { new: true },
      ).lean()
      return { transaction: transaction ?? undefined, existed: true }
    }
    return { transaction: undefined, existed: false }
  }
}

const updateTransaction = async (
  id: Types.ObjectId,
  update: Partial<Omit<PragmaticTransaction, '_id'>>,
): Promise<PragmaticTransaction | null> => {
  return await PragmaticTransactionModel.findOneAndUpdate({ _id: id }, update, {
    new: true,
  }).lean()
}

export async function getTransaction(transactionId: string) {
  const transaction = await PragmaticTransactionModel.findOne({
    transactionId,
  }).lean()
  return transaction
}

/**
 * Idempotent if used in transactionalProcessWithErrorHandling.
 */
export async function transactionalProcess(
  transactionType: TransactionType,
  user: UserTypes.User,
  request: Payload,
  processFunction: () => Promise<TransactionResp>,
): Promise<TransactionProcessResult<TransactionResp>> {
  // Pragmatic uses the same reference for a bet and its refund but we need to track them separately.
  const transactionId =
    transactionType === 'refund'
      ? `${request.reference}-refund`
      : request.reference

  const { existed, transaction } = await touchTransaction(
    user.id,
    transactionId,
    request,
    transactionType,
  )

  if (!transaction) {
    return {
      transactionId: '',
      error: SeamlessWalletStatusCodes.INTERNAL_SERVER_ERROR_NO_RECONCILE,
      description: 'transaction failed',
    }
  }

  if (!existed) {
    const response = await processFunction()
    await updateTransaction(transaction._id, {
      response,
    })
    return {
      ...response,
      transactionId: transaction._id.toString(),
    }
  }

  // TODO a bunch of stored responses have no error code, remove this when those have expired
  if (typeof transaction.response.error !== 'number') {
    pragmaticLogger('transactionalProcess', { userId: null }).error(
      'Stored response without status',
      { transaction },
    )
    // @ts-expect-error we have a bunch of stored responses with no status codes, remove when those are all gone.
    transaction.response.error =
      SeamlessWalletStatusCodes.INTERNAL_SERVER_ERROR_NO_RECONCILE
  }

  return {
    ...transaction.response,
    transactionId: transaction._id.toString(),
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: PragmaticTransactionModel.collection.name,
}
