import express from 'express'

import { api, type RouterApp } from 'src/util/api'
import { getAllApprovedAndEnabledGames } from '../documents/games'
import { loadGameTags } from '../dataloaders'

export interface GameTagEssential {
  id: string
  slug: string
}

interface TPGameEssential {
  id: string
  devices: string[]
  aggregator: string
  category: string
  identifier: string
  provider: string
  title: string
  popularity: number
  squareImage?: string
  releasedAt: Date
  tags: GameTagEssential[]
  tagPriorities: Record<string, number> | null
  createdAt: Date
}

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/tp-games', router)

  router.get(
    '/essentials',
    api.validatedApiCall(async () => {
      const games = await getAllApprovedAndEnabledGames()

      const allTagsIds = [
        ...new Set(games.flatMap(game => (game.tags ?? []).map(_id => _id))),
      ]

      const tagDocuments = (await loadGameTags(allTagsIds)).map(doc => ({
        id: doc._id.toString(),
        slug: doc.slug,
        excludeFromTags: doc.excludeFromTags,
      }))

      const essentials: TPGameEssential[] = games.map(game => {
        const {
          _id,
          devices,
          aggregator,
          category,
          identifier,
          provider,
          title,
          popularity,
          squareImage,
          releasedAt,
          tagPriorities,
          createdAt,
        } = game

        const tags = tagDocuments.filter(tag =>
          (game.tags ?? []).includes(tag.id),
        )

        return {
          id: _id.toString(),
          devices,
          aggregator,
          category,
          identifier,
          provider,
          title,
          popularity: popularity ?? 0,
          squareImage,
          releasedAt,
          tagPriorities: tagPriorities ?? null,
          createdAt,
          tagIds: game.tags,
          tags,
        }
      })

      return essentials
    }),
  )
}
