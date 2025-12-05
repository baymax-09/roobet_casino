import { type Types } from 'mongoose'

import { cryptoLogger } from '../lib/logger'
import { megaloMongo, MongoErrorCodes } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

interface UserWalletAuth {
  _id: Types.ObjectId
  id: string
  userId: string
  nonce: string
  address?: string
}

const UserWalletAuthSchema = new megaloMongo.Schema<UserWalletAuth>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    nonce: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
  },
  { timestamps: true },
)

UserWalletAuthSchema.index({ createdAt: 1 }, { expires: '5m' })

const UserWalletAuthModel = megaloMongo.model<UserWalletAuth>(
  'user_wallet_auths',
  UserWalletAuthSchema,
)

export async function getUserWalletAuth(
  userId: string,
): Promise<UserWalletAuth | null> {
  return await UserWalletAuthModel.findOne({ userId })
    .sort({ createdAt: -1 })
    .limit(1)
    .lean()
}

export async function createUserWalletAuth(
  walletAuth: Omit<UserWalletAuth, 'id' | '_id'>,
): Promise<UserWalletAuth | null> {
  try {
    return await UserWalletAuthModel.create(walletAuth)
  } catch (error) {
    cryptoLogger('createUserWalletAuth', { userId: walletAuth.userId }).error(
      `Create User Wallet Auth error - ${error.message}`,
      { walletAuth },
      error,
    )
    if (error.code === MongoErrorCodes.DUPLICATE_KEY) {
      return await getUserWalletAuth(walletAuth.userId)
    }
    return null
  }
}

export async function updateUserWalletAuth(
  walletAuth: Partial<UserWalletAuth>,
): Promise<UserWalletAuth | null> {
  return await UserWalletAuthModel.findOneAndUpdate(
    { userId: walletAuth.userId },
    { walletAuth },
  ).lean()
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: UserWalletAuthModel.collection.name,
}
