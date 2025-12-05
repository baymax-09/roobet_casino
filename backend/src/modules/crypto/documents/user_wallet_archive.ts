import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { type Crypto } from '../types'

// TODO break out ethereum and blockio supported wallets into two different collections
// THEY ARE FUNDAMENTALLY DIFFERENT
// wallet lookup functions should aggregate the two or lookup by specific crypto type/plugin
interface UserWallet {
  _id: string
  nonce: number
  userId: string
  address: string
  type: Crypto
}

const UserWalletSchema = new megaloMongo.Schema({
  userId: {
    type: String,
    index: true,
  },
  address: {
    type: String,
    index: true,
    unique: true,
  },
  type: {
    type: String,
    index: true,
  },
  nonce: {
    type: Number,
    index: true,
    unique: true,
  },
})

UserWalletSchema.index({ userId: 1, type: 1 })

const UserWalletArchiveModel = megaloMongo.model<UserWallet>(
  'user_wallets_archives',
  UserWalletSchema,
)

export async function getLegacyWalletsByUserId(
  userId: string,
): Promise<UserWallet[]> {
  return await UserWalletArchiveModel.find({ userId }).exec()
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: 'user_wallets_archives',
}
