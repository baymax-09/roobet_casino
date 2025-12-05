import leanVirtuals from 'mongoose-lean-virtuals'
import { type LeanDocument, type Types } from 'mongoose'

import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

export interface EthereumWalletDocument {
  _id: Types.ObjectId
  id: string
  address: string
  nonce: number
  userId: string
  hasBalance: boolean
  createdAt: Date
  updatedAt: Date
}

type CreateEthereumWallet = Omit<
  EthereumWalletDocument,
  '_id' | 'id' | 'createdAt' | 'updatedAt'
>

const EthereumWalletSchema = new megaloMongo.Schema<EthereumWalletDocument>(
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
    hasBalance: {
      type: Boolean,
      default: false,
    },
    nonce: {
      type: Number,
      index: true,
      unique: true,
    },
  },
  { timestamps: true },
)

EthereumWalletSchema.plugin(leanVirtuals)

const EthereumWalletModel = megaloMongo.model<EthereumWalletDocument>(
  'ethereum_wallets',
  EthereumWalletSchema,
)

export async function* getEthereumWallets(
  skip = 0,
  limit = 1000,
): AsyncIterableIterator<LeanDocument<EthereumWalletDocument>> {
  let hasWallets = true
  let offset = skip

  while (hasWallets) {
    const ethereumWallets = await EthereumWalletModel.find({})
      .sort({ nonce: 1 })
      .skip(offset)
      .limit(limit)
      .lean<Array<LeanDocument<EthereumWalletDocument>>>({ virtuals: true })

    for (const wallet of ethereumWallets) {
      yield wallet
    }

    if (ethereumWallets.length < limit) {
      hasWallets = false
    } else {
      offset += limit
    }
  }
}

export async function getLatestWallet(): Promise<
  EthereumWalletDocument[] | null
> {
  return await EthereumWalletModel.find({})
    .sort({ nonce: -1 })
    .limit(1)
    .lean<EthereumWalletDocument[]>({ virtuals: true })
}

export async function updateUserWalletByAddress(
  address: string,
  update: Partial<EthereumWalletDocument>,
): Promise<EthereumWalletDocument | null> {
  return await EthereumWalletModel.findOneAndUpdate(
    { address },
    update,
  ).lean<EthereumWalletDocument>({ virtuals: true })
}

export async function getUserWallet(
  userId: string,
): Promise<EthereumWalletDocument | null> {
  return await EthereumWalletModel.findOne({
    userId,
  }).lean<EthereumWalletDocument>({
    virtuals: true,
  })
}

export async function getWalletByAddress(
  address: string,
): Promise<EthereumWalletDocument | null> {
  return await EthereumWalletModel.findOne({
    address,
  }).lean<EthereumWalletDocument>({
    virtuals: true,
  })
}

export async function getWalletByUserId(
  userId: string,
): Promise<EthereumWalletDocument | null> {
  return await EthereumWalletModel.findOne({
    userId,
  }).lean<EthereumWalletDocument>({
    virtuals: true,
  })
}

export async function createUserWallet(
  wallet: CreateEthereumWallet,
): Promise<EthereumWalletDocument> {
  return await (
    await EthereumWalletModel.create(wallet)
  ).toObject({ virtuals: true })
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: EthereumWalletModel.collection.name,
}
