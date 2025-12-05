import { type Types } from 'mongoose'

import { MongoErrorCodes, mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { type BitcoinToken } from '../../types'

type ActionRequired = 'pool'

interface CreateBitcoinBalance {
  address: string
  token: 'btc'
  balance: number
  actionRequired: 'pool'
  processing: false
}

export interface BitcoinBalance {
  _id: Types.ObjectId
  address: string
  token: BitcoinToken
  balance: number
  createdAt: Date
  updatedAt: Date
  actionRequired: ActionRequired
  processing: boolean
}

const BitcoinBalancesSchema = new mongoose.Schema<BitcoinBalance>(
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

BitcoinBalancesSchema.index({ token: 1, actionRequired: 1 })
BitcoinBalancesSchema.index({ address: 1, token: 1 }, { unique: true })

const BitcoinBalancesModel = mongoose.model<BitcoinBalance>(
  'bitcoin_balances',
  BitcoinBalancesSchema,
)

export async function getBalancesByAddress(
  address: string,
): Promise<BitcoinBalance[]> {
  return await BitcoinBalancesModel.find({ address }).lean()
}

export async function getBalancesByToken(
  token: BitcoinToken,
): Promise<BitcoinBalance[]> {
  return await BitcoinBalancesModel.find({ token }).lean()
}

export async function getUnprocessedBalancesByToken(token: BitcoinToken) {
  return await BitcoinBalancesModel.find({ token, processing: false }).lean()
}

export async function getBalanceByTokenAndAddress(
  address: string,
  token: BitcoinToken,
): Promise<BitcoinBalance | null> {
  return await BitcoinBalancesModel.findOne({ address, token }).lean()
}

export async function getWalletBalanceByTokenAndActionRequired(
  address: string,
  token: BitcoinToken,
  actionRequired: ActionRequired,
): Promise<BitcoinBalance | null> {
  return await BitcoinBalancesModel.findOne({
    address,
    token,
    actionRequired,
  }).lean()
}

export async function updateWalletBalance(
  _id: Types.ObjectId,
  actionRequired: ActionRequired,
  processing: boolean,
): Promise<BitcoinBalance | null> {
  return await BitcoinBalancesModel.findOneAndUpdate(
    { _id },
    { actionRequired, processing },
  ).lean()
}

export async function updateWalletBalanceByTokenAndAddress(
  address: string,
  token: BitcoinToken,
  actionRequired: ActionRequired,
  processing: boolean,
): Promise<BitcoinBalance | null> {
  return await BitcoinBalancesModel.findOneAndUpdate(
    { address, token },
    { actionRequired, processing },
  ).lean()
}

export async function createWalletBalance(
  balanceObj: CreateBitcoinBalance,
): Promise<void> {
  try {
    await BitcoinBalancesModel.create(balanceObj)
  } catch (error) {
    // This is expected behavior of the unique index and we don't need to do anything about it
    if (error.code !== MongoErrorCodes.DUPLICATE_KEY) {
      throw error
    }
  }
}

export async function deleteWalletBalanceById(_id: Types.ObjectId) {
  await BitcoinBalancesModel.deleteOne({ _id })
}

export async function deleteWalletBalance(
  address: string,
  token: BitcoinToken,
): Promise<void> {
  await BitcoinBalancesModel.deleteOne({ address, token })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: BitcoinBalancesModel.collection.name,
}
