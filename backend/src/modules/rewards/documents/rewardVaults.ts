import { type Types } from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'

interface RewardVault {
  userId: string
  calendarDate: Date
  claimedAmount: number
  claimableAmount: number
  lastClaimedDate: Date
}

interface DBRewardVault extends RewardVault {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const RewardVaultSchema = new mongoose.Schema<DBRewardVault>(
  {
    userId: { type: String, required: true },
    calendarDate: { type: Date, required: true },
    claimedAmount: { type: Number, required: true, default: 0 },
    claimableAmount: { type: Number, required: true, default: 0 },
    lastClaimedDate: { type: Date },
  },
  { timestamps: true },
)

const RewardVaultModel = mongoose.model<DBRewardVault>(
  'reward_vaults',
  RewardVaultSchema,
)

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: RewardVaultModel.collection.name,
}
