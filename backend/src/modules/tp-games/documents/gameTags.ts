import { type UpdatePayload, type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { BasicCache } from 'src/util/redisModels'
import { type DBCollectionSchema } from 'src/modules'

export interface GameTag extends Record<string, any> {
  _id: Types.ObjectId
  title: string
  slug: string
  excludeFromTags?: boolean
  enabled?: boolean
  startDate?: Date
  endDate?: Date
  order?: number
  pageSize?: number
  showOnHomepage: boolean
}

const GameTagSchema = new mongoose.Schema<GameTag>({
  title: { type: String, index: true, unique: true },
  slug: { type: String, index: true, unique: true },
  excludeFromTags: { type: Boolean, default: false },
  enabled: { type: Boolean, default: false },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  order: { type: Number, default: 100 },
  pageSize: { type: Number, default: 6 },
  showOnHomepage: { type: Boolean, default: false },
})

const GameTagModel = mongoose.model<GameTag>('game_tags', GameTagSchema)

export async function createTag(
  payload: UpdatePayload<GameTag>,
): Promise<GameTag> {
  return await GameTagModel.create(payload)
}

export async function updateTag(id: string, payload: UpdatePayload<GameTag>) {
  return await GameTagModel.findByIdAndUpdate(id, payload, { new: true })
}

export async function deleteTag(id: string) {
  return await GameTagModel.findByIdAndDelete(id).lean()
}

export async function getAllTags(): Promise<GameTag[]> {
  return await GameTagModel.find().sort({ order: 1 }).lean()
}

export async function getAllEnabledTags(filter?: Partial<GameTag>) {
  const now = new Date()
  return await GameTagModel.find({
    ...filter,
    enabled: { $ne: false },
    startDate: { $not: { $gt: now } },
    endDate: { $not: { $lt: now } },
  })
    .sort({ order: 1 })
    .lean()
}

export async function getTagsById(ids: string[]): Promise<GameTag[]> {
  return await GameTagModel.find({
    _id: { $in: ids },
  }).lean()
}

const hydrateGameTagCache = async (tagIds: string[]) =>
  await getTagsById(tagIds)

/** This key name "gameTagsGQL" is temporary */
export const getCachedTagsForGame = async (
  tpGamesId: string,
  tagIds: string[],
) =>
  await BasicCache.cached(
    'gameTagsGQL',
    tpGamesId,
    60 * 10,
    async () => await hydrateGameTagCache(tagIds),
  )

export const bulkUpdateGameTags = async (
  payload: Parameters<(typeof GameTagModel)['bulkWrite']>[0],
) => {
  return await GameTagModel.bulkWrite(payload)
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: GameTagModel.collection.name,
}
