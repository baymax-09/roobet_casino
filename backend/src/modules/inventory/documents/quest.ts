import leanVirtuals from 'mongoose-lean-virtuals'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { type QuestTemplate } from './questTemplate'

export interface Quest extends QuestTemplate {
  userId: string
  completed: boolean
  userWageredAmountUSD?: number
  progress: number
}

export const QuestSchema = new mongoose.Schema<Quest>(
  {
    name: { type: String, required: true },
    userId: { type: String, index: true, required: true },
    criteriaType: { type: String, required: true, index: true },
    criteriaSettings: {
      urlPattern: {
        type: String,
        default: undefined,
        required: [
          function (this: Quest) {
            return this.criteriaType === 'PAGE_VIEW'
          },
          'criteriaSettings.urlPattern is required if criteriaType is PAGE_VIEW.',
        ],
      },
      wageredAmountUSD: {
        type: Number,
        default: undefined,
        required: [
          function (this: Quest) {
            return this.criteriaType === 'NEW_PLAYER_INCENTIVE'
          },
          'criteriaSettings.wageredAmountUSD is required for criteriaType NEW_PLAYER_INCENTIVE.',
        ],
      },
    },
    userWageredAmountUSD: {
      type: Number,
      required: [
        function (this: Quest) {
          return this.criteriaType === 'NEW_PLAYER_INCENTIVE'
        },
        'criteriaSettings.userWageredAmountUSD is required for criteriaType NEW_PLAYER_INCENTIVE.',
      ],
      default: undefined,
    },
    completed: { type: Boolean, index: true, default: false },
    rewardId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true },
)

QuestSchema.virtual('progress').get(function (this: any) {
  if (this.criteriaType === 'NEW_PLAYER_INCENTIVE') {
    return (
      (this.userWageredAmountUSD / this.criteriaSettings.wageredAmountUSD) * 100
    )
  }
})

QuestSchema.plugin(leanVirtuals)

export const QuestModel = mongoose.model<Quest>('quests', QuestSchema)

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: QuestModel.collection.name,
}
