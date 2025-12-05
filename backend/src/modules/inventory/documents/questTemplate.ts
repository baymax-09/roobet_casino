import { type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

/*
 * QUEST CRITERIA TYPES
 */
export type QuestCriteriaType = 'PAGE_VIEW' | 'NEW_PLAYER_INCENTIVE'

/*
 * QUEST SETTINGS
 */
export interface QuestPageViewSettings {
  urlPattern?: string | null
}

export interface QuestNewPlayerIncentiveSettings {
  wageredAmountUSD?: number | null
}

export type QuestCriteriaSettings =
  | QuestPageViewSettings
  | QuestNewPlayerIncentiveSettings

export interface QuestTemplate {
  _id: Types.ObjectId
  name: string
  criteriaType: QuestCriteriaType
  criteriaSettings: QuestCriteriaSettings
  rewardId?: Types.ObjectId | null
}

export const QuestTemplateSchema = new mongoose.Schema<QuestTemplate>(
  {
    name: { type: String, required: true },
    criteriaType: { type: String, required: true, index: true },
    criteriaSettings: {
      urlPattern: {
        type: String,
        default: undefined,
        required: [
          function (this: QuestTemplate) {
            return this.criteriaType === 'PAGE_VIEW'
          },
          'criteriaSettings.urlPattern is required if criteriaType is PAGE_VIEW.',
        ],
      },
      wageredAmountUSD: {
        type: Number,
        default: undefined,
        required: [
          function (this: QuestTemplate) {
            return this.criteriaType === 'NEW_PLAYER_INCENTIVE'
          },
          'criteriaSettings.wageredAmountUSD is required for criteriaType NEW_PLAYER_INCENTIVE.',
        ],
      },
    },
    rewardId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true },
)

export const QuestTemplateModel = mongoose.model<QuestTemplate>(
  'quest_templates',
  QuestTemplateSchema,
)

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: QuestTemplateModel.collection.name,
}
