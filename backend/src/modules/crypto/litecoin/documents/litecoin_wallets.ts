import { type Types } from 'mongoose'

import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { type AddressType, AddressTypes } from '../../dogecoin/util/constants'

export interface LitecoinWallet {
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

type CreateLitecoinWallet = Omit<LitecoinWallet, '_id'>

const LitecoinWalletSchema = new megaloMongo.Schema<LitecoinWallet>(
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

const LitecoinWalletModel = megaloMongo.model<LitecoinWallet>(
  'litecoin_wallets',
  LitecoinWalletSchema,
)

export async function getLitecoinWallet(
  address: string,
): Promise<LitecoinWallet | null> {
  return await LitecoinWalletModel.findOne({ address }).lean<LitecoinWallet>()
}

export async function getLitecoinWalletByUserId(
  userId: string,
): Promise<LitecoinWallet | null> {
  return await LitecoinWalletModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(1)
    .lean<LitecoinWallet>()
}

export async function getLitecoinWalletsByUserId(
  userId: string,
): Promise<LitecoinWallet[]> {
  return await LitecoinWalletModel.find({ userId }).lean<LitecoinWallet[]>()
}

export async function createLitecoinWallet(
  wallet: CreateLitecoinWallet,
): Promise<LitecoinWallet> {
  return await (await LitecoinWalletModel.create(wallet)).toObject()
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: LitecoinWalletModel.collection.name,
}
