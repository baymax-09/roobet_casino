import { type Types } from 'mongoose'

import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { type AddressType, AddressTypes } from '../util/constants'

export interface BitcoinWallet {
  _id: Types.ObjectId
  userId: string
  address: string
  nonce: number
  type: AddressType
  subscription?: {
    id: string
    active: boolean
  }
}

type CreateBitcoinWallet = Omit<BitcoinWallet, '_id'>

const BitcoinWalletSchema = new megaloMongo.Schema<BitcoinWallet>(
  {
    userId: {
      type: String,
      index: true,
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
      index: true,
      unique: true,
      required: true,
    },
    type: {
      type: String,
      enum: AddressTypes,
      required: true,
    },
    subscription: {
      id: {
        type: String,
        required: true,
      },
      active: {
        type: Boolean,
        required: true,
      },
    },
  },
  { timestamps: true },
)

const BitcoinWalletModel = megaloMongo.model<BitcoinWallet>(
  'bitcoin_wallets',
  BitcoinWalletSchema,
)

export async function getBitcoinWallet(
  address: string,
): Promise<BitcoinWallet | null> {
  return await BitcoinWalletModel.findOne({ address }).lean<BitcoinWallet>()
}

export async function getBitcoinWalletByUserId(
  userId: string,
): Promise<BitcoinWallet | null> {
  return await BitcoinWalletModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(1)
    .lean<BitcoinWallet>()
}

export async function getBitcoinWalletsByUserId(
  userId: string,
): Promise<BitcoinWallet[]> {
  return await BitcoinWalletModel.find({ userId }).lean<BitcoinWallet[]>()
}

export async function createBitcoinWallet(
  wallet: CreateBitcoinWallet,
): Promise<BitcoinWallet> {
  return await (await BitcoinWalletModel.create(wallet)).toObject()
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: BitcoinWalletModel.collection.name,
}
