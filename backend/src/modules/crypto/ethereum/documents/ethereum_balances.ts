import { type Types } from 'mongoose'

import { MongoErrorCodes, mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { type ERC20Token, type ETHToken } from '../types'

type ActionRequired = 'fund' | 'approve' | 'pool'
type ActionArg =
  | {
      token: 'eth'
      actionRequired: 'pool'
    }
  | {
      token: ERC20Token
      actionRequired: 'fund'
    }
type CreateEthereumBalance = {
  address: string
  processing: boolean
} & ActionArg

export interface EthereumBalance {
  _id: Types.ObjectId
  address: string
  token: ETHToken
  createdAt: Date
  updatedAt: Date

  /** the next step in the process for pooling this token
   *  Tokens should go from fund > approve > pool
   */
  actionRequired: ActionRequired
  /** Is this token currently being pooled? */
  processing: boolean
}

const EthereumBalancesSchema = new mongoose.Schema<EthereumBalance>(
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
      index: true,
      required: true,
    },
    processing: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

EthereumBalancesSchema.index({ address: 1, token: 1 }, { unique: true })

const EthereumBalancesModel = mongoose.model<EthereumBalance>(
  'ethereum_balances',
  EthereumBalancesSchema,
)

export async function getBalancesByAddress(
  address: string,
): Promise<EthereumBalance[]> {
  return await EthereumBalancesModel.find({ address }).lean()
}

export async function getBalancesByToken(
  token: ETHToken,
): Promise<EthereumBalance[]> {
  return await EthereumBalancesModel.find({ token }).lean()
}

export async function getBalanceByTokenAndAddress(
  address: string,
  token: ETHToken,
): Promise<EthereumBalance | null> {
  return await EthereumBalancesModel.findOne({ address, token }).lean()
}

export async function updateWalletBalance(
  _id: Types.ObjectId,
  actionRequired: ActionRequired,
  processing: boolean,
): Promise<EthereumBalance | null> {
  return await EthereumBalancesModel.findOneAndUpdate(
    { _id },
    { actionRequired, processing },
  ).lean()
}

export async function updateWalletBalanceByTokenAndAddress(
  address: string,
  token: ETHToken,
  actionRequired: ActionRequired,
  processing: boolean,
): Promise<EthereumBalance | null> {
  return await EthereumBalancesModel.findOneAndUpdate(
    { address, token },
    { actionRequired, processing },
  ).lean()
}

export async function createWalletBalance(
  balanceObj: CreateEthereumBalance,
): Promise<void> {
  try {
    await EthereumBalancesModel.create(balanceObj)
  } catch (error) {
    // This is expected behavior of the unique index and we don't need to do anything about it
    if (error.code !== MongoErrorCodes.DUPLICATE_KEY) {
      throw error
    }
  }
}

export async function deleteWalletBalanceById(_id: Types.ObjectId) {
  await EthereumBalancesModel.deleteOne({ _id })
}

export async function deleteWalletBalance(
  address: string,
  token: ETHToken,
): Promise<void> {
  await EthereumBalancesModel.deleteOne({ address, token })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: EthereumBalancesModel.collection.name,
}
