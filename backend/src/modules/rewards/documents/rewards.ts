import { type Types } from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'

interface Reward {
  userId: string
  instantAmount: number
  dailyAmount: number
  weeklyAmount: number
  monthlyAmount: number
  instantLastClaimed: Date
  dailyLastClaimed: Date
  weeklyLastClaimed: Date
  monthlyLastClaimed: Date
}

interface DBReward extends Reward {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

interface AddRakebackPayload {
  userId: string
  instantAmount: number
  dailyAmount: number
  weeklyAmount: number
  monthlyAmount: number
}

const RewardSchema = new mongoose.Schema<DBReward>(
  {
    userId: { type: String },
    instantAmount: { type: Number, default: 0 },
    dailyAmount: { type: Number, default: 0 },
    weeklyAmount: { type: Number, default: 0 },
    monthlyAmount: { type: Number, default: 0 },
    instantLastClaimed: { type: Date, default: Date.now },
    dailyLastClaimed: { type: Date, default: Date.now },
    weeklyLastClaimed: { type: Date, default: Date.now },
    monthlyLastClaimed: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

const RewardModel = mongoose.model<DBReward>('rewards', RewardSchema)

export const addRakebackForUser = async ({
  userId,
  instantAmount,
  dailyAmount,
  weeklyAmount,
  monthlyAmount,
}: AddRakebackPayload) => {
  if (!userId) {
    return
  }

  return await RewardModel.findOneAndUpdate(
    { userId },
    {
      $inc: {
        instantAmount: instantAmount || 0,
        dailyAmount: dailyAmount || 0,
        weeklyAmount: weeklyAmount || 0,
        monthlyAmount: monthlyAmount || 0,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: RewardModel.collection.name,
}
