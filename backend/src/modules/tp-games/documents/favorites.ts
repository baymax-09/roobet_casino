import { type DateTime } from 'aws-sdk/clients/devicefarm'
import { type FilterQuery, type UpdatePayload } from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'

import { filterOutDisabled } from './blocks'

export interface TPFavorites {
  identifier: string
  userId: string
  lastPlayed: DateTime
}

const TPFavoritesSchema = new mongoose.Schema<TPFavorites>(
  {
    identifier: { type: String, index: true },
    userId: { type: String, index: true },
    lastPlayed: Date,
  },
  { timestamps: true },
)

const TPFavoritesModel = mongoose.model<TPFavorites>(
  'tp_favorites',
  TPFavoritesSchema,
)

export async function getTPGameFavorite(
  userId: string,
  gameIdentifier: string,
) {
  return await TPFavoritesModel.findOne({ identifier: gameIdentifier, userId })
}

export async function addFavorite(
  filter: FilterQuery<TPFavorites>,
  payload: UpdatePayload<TPFavorites>,
) {
  await TPFavoritesModel.findOneAndUpdate(filter, payload, {
    new: true,
    upsert: true,
  })
}

export async function updateFavorite(
  filter: FilterQuery<TPFavorites>,
  payload: UpdatePayload<TPFavorites>,
) {
  await TPFavoritesModel.findOneAndUpdate(filter, payload)
}
export async function getFavoritesByUserId(
  userId: string,
  limit = 25,
  page = 0,
) {
  const results = await TPFavoritesModel.aggregate([
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
  const hydratedTPGames = results.map(({ gameDetails, createdAt }) => {
    // "createdAt" is when the game was favorited
    return { ...gameDetails, createdAt }
  })
  return await filterOutDisabled(hydratedTPGames)
}

export async function isFavorite(userId: string, identifier: string) {
  const results = await TPFavoritesModel.aggregate([
    { $match: { userId, identifier } },
  ])
  return results.length > 0
}

export async function removeFavorite(filter: FilterQuery<TPFavorites>) {
  await TPFavoritesModel.findOneAndDelete(filter)
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: TPFavoritesModel.collection.name,
}
