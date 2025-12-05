import { type Types } from 'mongoose'

import { MongoErrorCodes, mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import {
  type TRC20Token,
  type TronAddressBase58,
  type TronToken,
} from '../types'

type ActionRequired = 'fund' | 'approve' | 'pool'
type ActionArg =
  | {
      token: TronToken
      actionRequired: 'pool'
    }
  | {
      token: TRC20Token
      actionRequired: 'fund'
    }
type CreateTronBalance = {
  address: TronAddressBase58
  processing: boolean
} & ActionArg

export interface TronBalance {
  _id: Types.ObjectId
  address: TronAddressBase58
  token: TronToken | TRC20Token
  createdAt: Date
  updatedAt: Date

  /** the next step in the process for pooling this token
   *  Tokens should go from fund > approve > pool
   */
  actionRequired: ActionRequired
  /** Is this token currently being pooled? */
  processing: boolean
}

const TronBalancesSchema = new mongoose.Schema<TronBalance>(
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

TronBalancesSchema.index({ address: 1, token: 1 })
TronBalancesSchema.index({ token: 1, actionRequired: 1 })
TronBalancesSchema.index({ address: 1, token: 1 }, { unique: true })

const TronBalancesModel = mongoose.model<TronBalance>(
  'tron_balances',
  TronBalancesSchema,
)

export async function getBalancesByAddress(
  address: TronAddressBase58,
): Promise<TronBalance[]> {
  return await TronBalancesModel.find({ address }).lean()
}

export async function getBalancesByToken(
  token: TronToken | TRC20Token,
): Promise<TronBalance[]> {
  return await TronBalancesModel.find({ token }).lean()
}

export async function getUnprocessedBalancesByToken(
  token: TronToken | TRC20Token,
) {
  return await TronBalancesModel.find({ token, processing: false }).lean()
}

export async function getBalanceByTokenAndAddress(
  address: TronAddressBase58,
  token: TronToken | TRC20Token,
): Promise<TronBalance | null> {
  return await TronBalancesModel.findOne({ address, token }).lean()
}

export async function getWalletBalanceByTokenAndActionRequired(
  address: TronAddressBase58,
  token: TronToken | TRC20Token,
  actionRequired: ActionRequired,
): Promise<TronBalance | null> {
  return await TronBalancesModel.findOne({
    address,
    token,
    actionRequired,
  }).lean()
}

export async function getBalanceByTRC20TokenAndActionRequired(
  address: TronAddressBase58,
  actionRequired: ActionRequired,
): Promise<TronBalance[]> {
  return await TronBalancesModel.find({
    address,
    actionRequired,
    token: { $ne: 'trx' },
  }).lean()
}

export async function updateWalletBalance(
  _id: Types.ObjectId,
  actionRequired: ActionRequired,
  processing: boolean,
): Promise<TronBalance | null> {
  return await TronBalancesModel.findOneAndUpdate(
    { _id },
    { actionRequired, processing },
  ).lean()
}

export async function updateWalletBalanceByTokenAndAddress(
  address: TronAddressBase58,
  token: TronToken | TRC20Token,
  actionRequired: ActionRequired,
  processing: boolean,
): Promise<TronBalance | null> {
  return await TronBalancesModel.findOneAndUpdate(
    { address, token },
    { actionRequired, processing },
  ).lean()
}

export async function createWalletBalance(
  balanceObj: CreateTronBalance,
): Promise<void> {
  try {
    await TronBalancesModel.create(balanceObj)
  } catch (error) {
    // This is expected behavior of the unique index and we don't need to do anything about it
    if (error.code !== MongoErrorCodes.DUPLICATE_KEY) {
      throw error
    }
  }
}

export async function deleteWalletBalanceById(_id: Types.ObjectId) {
  await TronBalancesModel.deleteOne({ _id })
}

export async function deleteWalletBalance(
  address: TronAddressBase58,
  token: TronToken | TRC20Token,
): Promise<void> {
  await TronBalancesModel.deleteOne({ address, token })
}

// Temporary for a hotfix -- DO NOT USE
export async function resetProcessingStatus() {
  await TronBalancesModel.updateMany(
    { processing: true },
    { processing: false },
  )
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: TronBalancesModel.collection.name,
}
