import { type Types } from 'mongoose'

import { MongoErrorCodes, mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { type DogecoinToken } from '../../types'

type ActionRequired = 'pool'

interface CreateDogecoinBalance {
  address: string
  token: 'doge'
  balance: number
  actionRequired: 'pool'
  processing: false
}

export interface DogecoinBalance {
  _id: Types.ObjectId
  address: string
  token: DogecoinToken
  balance: number
  createdAt: Date
  updatedAt: Date
  actionRequired: ActionRequired
  processing: boolean
}

const DogecoinBalancesSchema = new mongoose.Schema<DogecoinBalance>(
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

DogecoinBalancesSchema.index({ token: 1, actionRequired: 1 })
DogecoinBalancesSchema.index({ address: 1, token: 1 }, { unique: true })

const DogecoinBalancesModel = mongoose.model<DogecoinBalance>(
  'dogecoin_balances',
  DogecoinBalancesSchema,
)

export async function getBalancesByAddress(
  address: string,
): Promise<DogecoinBalance[]> {
  return await DogecoinBalancesModel.find({ address }).lean()
}

export async function getBalancesByToken(
  token: DogecoinToken,
): Promise<DogecoinBalance[]> {
  return await DogecoinBalancesModel.find({ token }).lean()
}

export async function getUnprocessedBalancesByToken(token: DogecoinToken) {
  return await DogecoinBalancesModel.find({ token, processing: false }).lean()
}

export async function getBalanceByTokenAndAddress(
  address: string,
  token: DogecoinToken,
): Promise<DogecoinBalance | null> {
  return await DogecoinBalancesModel.findOne({ address, token }).lean()
}

export async function getWalletBalanceByTokenAndActionRequired(
  address: string,
  token: DogecoinToken,
  actionRequired: ActionRequired,
): Promise<DogecoinBalance | null> {
  return await DogecoinBalancesModel.findOne({
    address,
    token,
    actionRequired,
  }).lean()
}

export async function updateWalletBalance(
  _id: Types.ObjectId,
  actionRequired: ActionRequired,
  processing: boolean,
): Promise<DogecoinBalance | null> {
  return await DogecoinBalancesModel.findOneAndUpdate(
    { _id },
    { actionRequired, processing },
  ).lean()
}

export async function updateWalletBalanceByTokenAndAddress(
  address: string,
  token: DogecoinToken,
  actionRequired: ActionRequired,
  processing: boolean,
): Promise<DogecoinBalance | null> {
  return await DogecoinBalancesModel.findOneAndUpdate(
    { address, token },
    { actionRequired, processing },
  ).lean()
}

export async function createWalletBalance(
  balanceObj: CreateDogecoinBalance,
): Promise<void> {
  try {
    await DogecoinBalancesModel.create(balanceObj)
  } catch (error) {
    // This is expected behavior of the unique index and we don't need to do anything about it
    if (error.code !== MongoErrorCodes.DUPLICATE_KEY) {
      throw error
    }
  }
}

export async function deleteWalletBalanceById(_id: Types.ObjectId) {
  await DogecoinBalancesModel.deleteOne({ _id })
}

export async function deleteWalletBalance(
  address: string,
  token: DogecoinToken,
): Promise<void> {
  await DogecoinBalancesModel.deleteOne({ address, token })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: DogecoinBalancesModel.collection.name,
}
