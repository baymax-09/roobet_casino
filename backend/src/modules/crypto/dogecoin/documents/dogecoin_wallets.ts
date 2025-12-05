import { type Types } from 'mongoose'

import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

export interface DogecoinWallet {
  _id: Types.ObjectId
  userId: string
  address: string
  nonce: number
  subscription?: {
    id: string
    active: boolean
  }
}

type CreateDogecoinWallet = Omit<DogecoinWallet, '_id'>

const DogecoinWalletSchema = new megaloMongo.Schema<DogecoinWallet>(
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

const DogecoinWalletModel = megaloMongo.model<DogecoinWallet>(
  'dogecoin_wallets',
  DogecoinWalletSchema,
)

export async function getDogecoinWallet(
  address: string,
): Promise<DogecoinWallet | null> {
  return await DogecoinWalletModel.findOne({ address }).lean<DogecoinWallet>()
}

export async function getDogecoinWalletByUserId(
  userId: string,
): Promise<DogecoinWallet | null> {
  return await DogecoinWalletModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(1)
    .lean<DogecoinWallet>()
}

export async function getDogecoinWalletsByUserId(
  userId: string,
): Promise<DogecoinWallet[]> {
  return await DogecoinWalletModel.find({ userId }).lean<DogecoinWallet[]>()
}

export async function createDogecoinWallet(
  wallet: CreateDogecoinWallet,
): Promise<DogecoinWallet> {
  return await (await DogecoinWalletModel.create(wallet)).toObject()
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: DogecoinWalletModel.collection.name,
}
