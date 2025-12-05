import { type Types } from 'mongoose'
import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { type TronAddressBase58 } from '../types'

export interface TronWallet {
  _id: Types.ObjectId
  userId: string
  address: TronAddressBase58
  nonce: number
}

type CreateTronWallet = Omit<TronWallet, '_id'>

const TronWalletSchema = new megaloMongo.Schema<TronWallet>(
  {
    userId: {
      type: String,
      index: true,
      unique: true,
      required: true,
    },
    address: {
      type: String,
      index: true,
      unique: true,
      required: true,
    },
    nonce: {
      type: Number,
      unique: true,
      required: true,
    },
  },
  { timestamps: true },
)

const TronWalletModel = megaloMongo.model<TronWallet>(
  'tron_wallets',
  TronWalletSchema,
)

export async function getTronWallet(
  address: TronAddressBase58,
): Promise<TronWallet | null> {
  return await TronWalletModel.findOne({ address }).lean<TronWallet>()
}

export async function getTronWalletByUserId(
  userId: string,
): Promise<TronWallet | null> {
  return await TronWalletModel.findOne({ userId }).lean<TronWallet>()
}

export async function createUserTronWallet(
  tronWallet: CreateTronWallet,
): Promise<TronWallet> {
  return await (await TronWalletModel.create(tronWallet)).toObject()
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: TronWalletModel.collection.name,
}
