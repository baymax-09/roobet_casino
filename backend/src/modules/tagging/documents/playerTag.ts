import { type Types } from 'mongoose'

import { mongoose } from 'src/system'

export interface RequiredPlayerTagFields {
  userId: string
  tagId: string
}

export interface PlayerTag extends RequiredPlayerTagFields {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const PlayerTagSchema = new mongoose.Schema<PlayerTag>(
  {
    userId: { type: String, required: true },
    tagId: { type: String, required: true },
  },
  { timestamps: true },
)

PlayerTagSchema.index({ userId: 1, tagId: 1 }, { unique: true })

export const PlayerTagModel = mongoose.model<PlayerTag>(
  'player_tags',
  PlayerTagSchema,
)

export const getPlayerTag = async (
  userId: string,
  tagId: string,
): Promise<PlayerTag | null> => {
  const existingTag = await PlayerTagModel.findOne({ userId, tagId }).lean()

  return existingTag
}

export const canPlayerCreateTag = async (
  userId: string,
): Promise<PlayerTag | null> => {
  const delay = 60000 // 1 minute

  const lastUpdatedTag = await PlayerTagModel.findOne({
    userId,
    updatedAt: { $gte: new Date(Date.now() - delay) },
  }).lean()

  return lastUpdatedTag
}

export const createPlayerTag = async (
  userId: string,
  tagId: string,
): Promise<PlayerTag> => {
  const result = await PlayerTagModel.create({ userId, tagId })
  return result
}
