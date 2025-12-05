import { type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

// No DB prefix here because there is only ever a single type with no form of inheritance
export interface RewardsAndQuestsLogbook {
  _id: Types.ObjectId
  userId: string
  claimedQuestIds: Types.ObjectId[]
  claimedRewardIds: Types.ObjectId[]
}

export const RewardsAndQuestsLogbookSchema =
  new mongoose.Schema<RewardsAndQuestsLogbook>(
    {
      userId: { type: String, unique: true, required: true, index: true },
      claimedQuestIds: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true,
      },
      claimedRewardIds: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true,
      },
    },
    { timestamps: true },
  )

export const RewardsAndQuestsLogbookModel =
  mongoose.model<RewardsAndQuestsLogbook>(
    'rewards_and_quest_logbooks',
    RewardsAndQuestsLogbookSchema,
  )

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: RewardsAndQuestsLogbookModel.collection.name,
}
