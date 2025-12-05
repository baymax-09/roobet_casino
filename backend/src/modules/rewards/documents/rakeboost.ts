import { type Types } from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'
import { type User, type DBUser } from 'src/modules/user/types/User'

import { type RakeBoost, type RakeBoostType, RakeBoostTypes } from '../types'
import { RAKEBOOST_TYPE_INFO } from '../util'
import { determineSingleFeatureAccess } from 'src/util/features'

export interface DBRakeBoost extends RakeBoost {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const RakeBoostSchema = new mongoose.Schema<DBRakeBoost>(
  {
    userId: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    rakebackPercentage: {
      type: Number,
      required: true,
      validate: [
        {
          validator: (value: any) => {
            return Number.isInteger(value) && value <= 100 && value >= 0
          },
          message: 'Rakeback percentage must be an integer from 0 to 100.',
        },
      ],
    },
    totalEarned: { type: Number, required: true, default: 0 },
    type: { type: String, enum: RakeBoostTypes, required: true },
  },
  { timestamps: true },
)

RakeBoostSchema.index({ userId: 1, endTime: 1 })

export const createRakeboost = async (
  user: User | DBUser,
  type: RakeBoostType,
): Promise<DBRakeBoost | null> => {
  const rewardsRedesignEnabled = await determineSingleFeatureAccess({
    countryCode: '',
    featureName: 'rewardsRedesign',
    user,
  })

  if (!rewardsRedesignEnabled) {
    return null
  }

  const { rakebackPercentage, duration } = RAKEBOOST_TYPE_INFO[type]

  const startTime = Date.now()
  // Using "startTime" so the times are lined up as exact as possible.
  const endTime = new Date(startTime + duration)

  return await RakeBoostModel.create({
    userId: user.id,
    type,
    startTime,
    endTime,
    rakebackPercentage,
  })
}

const RakeBoostModel = mongoose.model<DBRakeBoost>(
  'rakeboosts',
  RakeBoostSchema,
)

export const getActiveRakeboost = async (
  userId: string,
): Promise<DBRakeBoost | null> => {
  const activeRakeboost = await RakeBoostModel.find({
    userId,
    endTime: { $gt: new Date() }, // Only grab rakeboosts that have not ended.
  })
    .sort({ rakebackPercentage: -1 }) // Sort by rakebackPercentage in descending order.
    .limit(1) // Grab the first one (highest rakebackPercentage).

  return activeRakeboost.length ? activeRakeboost[0] : null
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: RakeBoostModel.collection.name,
}
