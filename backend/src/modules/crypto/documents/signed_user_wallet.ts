import { type Types } from 'mongoose'

import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

interface SignedUserWallet {
  _id: Types.ObjectId
  id: string
  userId: string
  address: string
  signature: string
}

const SignedUserWalletSchema = new megaloMongo.Schema<SignedUserWallet>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
      unique: true,
    },
    signature: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
)

const SignedUserWalletModel = megaloMongo.model<SignedUserWallet>(
  'signed_user_wallets',
  SignedUserWalletSchema,
)

export async function getSignedUserWallet(
  userId: string,
): Promise<SignedUserWallet | null> {
  return await SignedUserWalletModel.findOne({ userId })
    .sort({ createdAt: -1 })
    .limit(1)
    .lean()
}

export async function createSignedUserWallet(
  signedWallet: Partial<SignedUserWallet>,
): Promise<SignedUserWallet> {
  return await SignedUserWalletModel.create(signedWallet)
}

export async function removeSignedUserWallet(
  userId: string,
): Promise<SignedUserWallet | null> {
  return await SignedUserWalletModel.findOneAndDelete({ userId }).lean()
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: SignedUserWalletModel.collection.name,
}
