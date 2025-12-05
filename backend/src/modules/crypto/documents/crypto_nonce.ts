import { type Types } from 'mongoose'

import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { type CryptoNetwork } from '../types'

interface CryptoNonce {
  _id: Types.ObjectId
  crypto: CryptoNetwork
  nonce: number
}

const CryptoNonceSchema = new megaloMongo.Schema<CryptoNonce>(
  {
    crypto: {
      type: String,
      unique: true,
      required: true,
    },
    nonce: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
)

const CryptoNonceModel = megaloMongo.model<CryptoNonce>(
  'crypto_nonces',
  CryptoNonceSchema,
)

export async function createCryptoNonce(
  cryptoNonce: Omit<CryptoNonce, '_id'>,
): Promise<CryptoNonce> {
  return await CryptoNonceModel.create(cryptoNonce)
}

export async function incrementCryptoNonce(
  crypto: CryptoNetwork,
): Promise<CryptoNonce | null> {
  return await CryptoNonceModel.findOneAndUpdate(
    { crypto },
    { $inc: { nonce: 1 } },
    { new: true },
  )
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: CryptoNonceModel.collection.name,
}
