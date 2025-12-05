import { type Types } from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'

import { type Rank, type LevelInfo } from '../types/ranks'

interface DBRank extends Rank {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const LevelInfoSchema = new mongoose.Schema<LevelInfo>(
  {
    unlockedTime: { type: Date, default: Date.now() },
    claimedTime: { type: Date },
    rankUpBonusAmount: { type: Number, default: 0 },
  },
  { _id: false },
)

const RankSchema = new mongoose.Schema<DBRank>(
  {
    userId: { type: String, required: true, index: true, unique: true },
    totalWageredAmount: { type: Number, required: true, default: 0 },
    // Keeps track of how much the user will receive in rank up rewards in between each rank.
    expectedRakebackOnRankUp: { type: Number, required: true, default: 0 },
    levelInfo: { type: Map, of: LevelInfoSchema, required: true }, // Define levelInfo as a Map with LevelInfoSchema as its value type
  },
  { timestamps: true },
)

const RankModel = mongoose.model<DBRank>('rewards_ranks', RankSchema)

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: RankModel.collection.name,
}
