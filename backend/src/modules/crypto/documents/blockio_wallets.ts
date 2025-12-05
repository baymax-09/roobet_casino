import leanVirtuals from 'mongoose-lean-virtuals'
import { type Types } from 'mongoose'

import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { type BlockioCryptoProperName } from '../types'

export interface BlockioWallet {
  _id: Types.ObjectId
  id: string
  address: string
  userId: string
  type: BlockioCryptoProperName
}

const BlockioWalletSchema = new megaloMongo.Schema<BlockioWallet>(
  {
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
  },
  { timestamps: true },
)

BlockioWalletSchema.index({ userId: 1, type: 1 })
BlockioWalletSchema.index({ address: 1, type: 1 })

BlockioWalletSchema.plugin(leanVirtuals)

const BlockioWalletModel = megaloMongo.model<BlockioWallet>(
  'blockio_wallets',
  BlockioWalletSchema,
)

export async function getUserWallets(userId: string): Promise<BlockioWallet[]> {
  return await BlockioWalletModel.find({ userId }).lean<BlockioWallet[]>({
    virtuals: true,
  })
}

export async function getUserWallet(
  userId: string,
  type: BlockioCryptoProperName,
): Promise<BlockioWallet | undefined> {
  return await getUserWalletByType(userId, type)
}

export async function getUserWalletByType(
  userId: string,
  type: BlockioCryptoProperName,
): Promise<BlockioWallet | undefined> {
  const [wallet] = await BlockioWalletModel.find({ userId, type })
    .sort({ createdAt: -1 })
    .limit(1)
    .lean<BlockioWallet[]>({ virtuals: true })

  return wallet
}

export async function getWalletByAddress(
  address: string,
): Promise<BlockioWallet | null> {
  return await BlockioWalletModel.findOne({ address }).lean<BlockioWallet>({
    virtuals: true,
  })
}

export async function getWalletForAddressAndType(
  address: string,
  type: BlockioCryptoProperName,
): Promise<BlockioWallet | null> {
  return await BlockioWalletModel.findOne({
    address,
    type,
  }).lean<BlockioWallet>({ virtuals: true })
}

export async function createUserWallet(
  wallet: Omit<BlockioWallet, '_id' | 'id'>,
): Promise<BlockioWallet> {
  return await (
    await BlockioWalletModel.create(wallet)
  ).toObject({ virtuals: true })
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: BlockioWalletModel.collection.name,
}
