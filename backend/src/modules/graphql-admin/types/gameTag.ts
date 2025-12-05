import { objectType, list } from 'nexus'

import { DataLoaders } from 'src/modules/tp-games'

import { TPGameAdminType } from './tpGameAdmin'

export const GameTagType = objectType({
  name: 'GameTag',
  sourceType: {
    module: __dirname,
    export: 'DBGameTag',
  },
  definition(type) {
    type.nonNull.string('id', {
      auth: null,
      resolve: ({ _id }) => _id.toString(),
    })
    type.field('games', {
      auth: null,
      type: list(TPGameAdminType),
      resolve: async root => {
        const tagId = root._id.toString()
        const games = await DataLoaders.loadGamesByTagId(tagId)
        const sortedGames = games.sort(
          ({ tagPriorities: tpA = {} }, { tagPriorities: tpB = {} }) => {
            const priorityA = tpA[tagId] ?? 0
            const priorityB = tpB[tagId] ?? 0
            return priorityA - priorityB
          },
        )
        return sortedGames
      },
    })
    type.nonNull.string('title')
    type.nonNull.string('slug')
    type.boolean('excludeFromTags')
    type.boolean('enabled')
    type.date('startDate')
    type.date('endDate')
    type.int('order')
    type.int('pageSize')
    type.boolean('showOnHomepage')
    type.int('count')
  },
})
