import { type Types } from 'mongoose'

import { MongoErrorCodes, mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { type LitecoinToken } from '../../types'

type ActionRequired = 'pool'

interface CreateLitecoinBalance {
  address: string
  token: 'ltc'
  balance: number
  actionRequired: 'pool'
  processing: false
}

export interface LitecoinBalance {
  _id: Types.ObjectId
  address: string
  token: LitecoinToken
  balance: number
  createdAt: Date
  updatedAt: Date
  actionRequired: ActionRequired
  processing: boolean
}

const LitecoinBalancesSchema = new mongoose.Schema<LitecoinBalance>(
  {
    address: {
      type: String,
      index: true,
      required: true,
    },
    token: {
      type: String,
      index: true,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
      required: true,
    },
    actionRequired: {
      type: String,
      required: true,
    },
    processing: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

LitecoinBalancesSchema.index({ token: 1, actionRequired: 1 })
LitecoinBalancesSchema.index({ address: 1, token: 1 }, { unique: true })

const LitecoinBalancesModel = mongoose.model<LitecoinBalance>(
  'litecoin_balances',
  LitecoinBalancesSchema,
)

export async function getBalancesByAddress(
  address: string,
): Promise<LitecoinBalance[]> {
  return await LitecoinBalancesModel.find({ address }).lean()
}

export async function getBalancesByToken(
  token: LitecoinToken,
): Promise<LitecoinBalance[]> {
  return await LitecoinBalancesModel.find({ token }).lean()
}

export async function getUnprocessedBalancesByToken(token: LitecoinToken) {
  return await LitecoinBalancesModel.find({ token, processing: false }).lean()
}

export async function getBalanceByTokenAndAddress(
  address: string,
  token: LitecoinToken,
): Promise<LitecoinBalance | null> {
  return await LitecoinBalancesModel.findOne({ address, token }).lean()
}

export async function getWalletBalanceByTokenAndActionRequired(
  address: string,
  token: LitecoinToken,
  actionRequired: ActionRequired,
): Promise<LitecoinBalance | null> {
  return await LitecoinBalancesModel.findOne({
    address,
    token,
    actionRequired,
  }).lean()
}

export async function updateWalletBalance(
  _id: Types.ObjectId,
  actionRequired: ActionRequired,
  processing: boolean,
): Promise<LitecoinBalance | null> {
  return await LitecoinBalancesModel.findOneAndUpdate(
    { _id },
    { actionRequired, processing },
  ).lean()
}

export async function updateWalletBalanceByTokenAndAddress(
  address: string,
  token: LitecoinToken,
  actionRequired: ActionRequired,
  processing: boolean,
): Promise<LitecoinBalance | null> {
  return await LitecoinBalancesModel.findOneAndUpdate(
    { address, token },
    { actionRequired, processing },
  ).lean()
}

export async function createWalletBalance(
  balanceObj: CreateLitecoinBalance,
): Promise<void> {
  try {
    await LitecoinBalancesModel.create(balanceObj)
  } catch (error) {
    // This is expected behavior of the unique index and we don't need to do anything about it
    if (error.code !== MongoErrorCodes.DUPLICATE_KEY) {
      throw error
    }
  }
}

export async function deleteWalletBalanceById(_id: Types.ObjectId) {
  await LitecoinBalancesModel.deleteOne({ _id })
}

export async function deleteWalletBalance(
  address: string,
  token: LitecoinToken,
): Promise<void> {
  await LitecoinBalancesModel.deleteOne({ address, token })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: LitecoinBalancesModel.collection.name,
}
