import { type Types } from 'mongoose'

import { MongoErrorCodes, mongoose } from 'src/system'
import { type Types as UserTypes } from 'src/modules/user'
import { type DBCollectionSchema } from 'src/modules'

import {
  type WinRequest,
  type BetRequest,
  type RollbackRequest,
} from '../lib/transactions'
import { makeErrorResponse, type Hub88TransactionResp } from '../lib/utils'
import { StatusCodes } from '../lib/enums'
import { hub88Logger } from '../lib/logger'

export interface Hub88Transaction {
  _id: Types.ObjectId
  response: string
  rolledBack: boolean
  transactionId: string
  transactionType: string
  userId: string
  attempts: number
  createdAt: Date
  updatedAt: Date
}

const Hub88TransactionSchema = new mongoose.Schema<Hub88Transaction>(
  {
    response: { type: String },
    rolledBack: { type: Boolean },
    transactionId: { type: String, unique: true },
    transactionType: { type: String },
    userId: { type: String },
    attempts: { type: Number, default: 1 },
  },
  { timestamps: true },
)

Hub88TransactionSchema.index({ updatedAt: 1 }, { expires: '3d' })

const Hub88TransactionModel = mongoose.model<Hub88Transaction>(
  'hub88_transactions',
  Hub88TransactionSchema,
)

export async function touchTransaction(
  user: UserTypes.User,
  transactionId: string,
  transactionType: string,
): Promise<{
  transaction: Hub88Transaction | undefined
  existed?: boolean
}> {
  try {
    const transaction = await Hub88TransactionModel.create({
      transactionId,
      transactionType,
      userId: user.id,
    })
    return { transaction, existed: false }
  } catch (error) {
    if (error.code === MongoErrorCodes.DUPLICATE_KEY) {
      const transaction = await Hub88TransactionModel.findOneAndUpdate(
        { transactionId },
        { $inc: { attempts: 1 } },
        { new: true },
      ).lean()
      return { transaction: transaction ?? undefined, existed: true }
    }
    return { transaction: undefined, existed: false }
  }
}

export async function getTransaction(
  transactionId: string,
): Promise<Hub88Transaction | null> {
  const transaction = await Hub88TransactionModel.findOne({
    transactionId,
  }).lean()
  return transaction
}

const updateTransaction = async (
  id: Types.ObjectId,
  payload: Partial<Omit<Hub88Transaction, '_id'>>,
): Promise<Hub88Transaction | null> => {
  return await Hub88TransactionModel.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  }).lean()
}

export async function setTransactionRolledBack(
  transactionId: string,
): Promise<void> {
  await Hub88TransactionModel.findOneAndUpdate(
    { transactionId },
    { rolledBack: true },
  )
}

/**
 * Hub88 documentation instructs us to compare a few key fields for changes on retries.
 * round, user, game_code, amount, reference_transaction_uuid
 */
const areStaticTransactionFieldsEqual = (
  original: WinRequest | BetRequest | RollbackRequest,
  current: WinRequest | BetRequest | RollbackRequest,
): boolean => {
  const baseFieldsAreEqual =
    original.round === current.round &&
    original.user === current.user &&
    original.game_code === current.game_code

  // amount should be on neither(rollback) OR both and equal(win/bet)
  const amountEqual = (() => {
    if ('amount' in original) {
      if ('amount' in current) {
        return original.amount === current.amount
      }
      return false
    }
    if ('amount' in current) {
      return false
    }
    return true
  })()

  // reference_transaction_uuid should be on neither(bet/win) or both and equal(rollback)
  const referenceEqual = (() => {
    if ('reference_transaction_uuid' in original) {
      if ('reference_transaction_uuid' in current) {
        return (
          original.reference_transaction_uuid ===
          current.reference_transaction_uuid
        )
      }
      return false
    }
    if ('reference_transaction_uuid' in current) {
      return false
    }
    return true
  })()

  return baseFieldsAreEqual && amountEqual && referenceEqual
}

export interface TransactionTypeRequest {
  bet: BetRequest
  win: WinRequest
  rollback: RollbackRequest
}

export async function transactionalProcess<
  T extends 'bet' | 'win' | 'rollback',
>(
  user: UserTypes.User,
  transactionId: string,
  processFunction: () => Promise<Hub88TransactionResp>,
  transactionType: T,
  request: TransactionTypeRequest[T],
): Promise<Hub88TransactionResp> {
  const { existed, transaction } = await touchTransaction(
    user,
    transactionId,
    transactionType,
  )

  if (!transaction) {
    throw new Error('Failed to write or load transaction document.')
  }

  if (!existed) {
    const response = await processFunction()
    await updateTransaction(transaction._id, {
      response: JSON.stringify(response),
    })

    return response
  }

  const originalResponse = JSON.parse(transaction.response)
  if (
    originalResponse.request &&
    !areStaticTransactionFieldsEqual(originalResponse.request, request)
  ) {
    hub88Logger('transactionalProcess', { userId: user.id }).info(
      'duplicate txn',
      {
        current: request,
        original: originalResponse.request,
      },
    )
    return makeErrorResponse(
      'Transaction already processed',
      StatusCodes.RS_ERROR_DUPLICATE_TRANSACTION,
    )
  }

  return originalResponse
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: Hub88TransactionModel.collection.name,
}
