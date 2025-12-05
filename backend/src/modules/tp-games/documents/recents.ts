import { type FilterQuery, type UpdatePayload } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { filterOutDisabled } from '../documents/blocks'
import { type TPGame } from './games'

interface TPRecents {
  identifier: string
  userId: string
  lastPlayed: Date
}

const TPRecentsSchema = new mongoose.Schema<TPRecents>(
  {
    identifier: { type: String, index: true },
    userId: { type: String, index: true },
    lastPlayed: Date,
  },
  { timestamps: true },
)

TPRecentsSchema.index({ identifier: 1, userId: 1 })

const TPRecentsModel = mongoose.model<TPRecents>('tp_recents', TPRecentsSchema)

export async function addRecent(
  filter: FilterQuery<TPRecents>,
  payload: UpdatePayload<TPRecents>,
) {
  await TPRecentsModel.findOneAndUpdate(filter, payload, {
    new: true,
    upsert: true,
  })
}

export async function getRecentsByUserId(userId: string, limit = 20, page = 0) {
  const results = await TPRecentsModel.aggregate<
    { gameDetails: TPGame } & TPRecents
  >([
    { $match: { userId } },
    { $sort: { lastPlayed: -1 } },
    { $skip: page * limit },
    { $limit: limit },
    {
      $lookup: {
        from: 'tp_games',
        localField: 'identifier',
        foreignField: 'identifier',
        as: 'gameDetails',
      },
    },
    { $match: { 'gameDetails.0.approvalStatus': 'approved' } },
    { $unwind: '$gameDetails' },
  ])

  const hydratedTPGames = results.map(({ gameDetails }) => {
    return { ...gameDetails }
  })

  return await filterOutDisabled(hydratedTPGames)
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: TPRecentsModel.collection.name,
}
