import { type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

interface BaseSplashClaim {
  userId: string
  bonusCode: string
  transactionId: string
}

export interface SplashClaim extends BaseSplashClaim {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const SplashClaimSchema = new mongoose.Schema<SplashClaim>(
  {
    userId: { type: String, required: true },
    bonusCode: { type: String, required: true },
    transactionId: { type: String, required: true },
  },
  { timestamps: true },
)

SplashClaimSchema.index({ transactionId: 1 }, { unique: true })

const SplashClaimModel = mongoose.model<SplashClaim>(
  'splash_claim',
  SplashClaimSchema,
)

export const createSplashClaim = async (
  claim: BaseSplashClaim,
): Promise<SplashClaim> => {
  return await SplashClaimModel.create(claim)
}

export const deleteSplashClaim = async (
  claimId: Types.ObjectId,
): Promise<void> => {
  await SplashClaimModel.deleteOne({ _id: claimId })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: SplashClaimModel.collection.name,
}
