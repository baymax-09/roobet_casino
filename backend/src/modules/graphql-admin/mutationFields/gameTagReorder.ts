import { mutationField, nonNull, list } from 'nexus'

import {
  getAllTags,
  bulkUpdateGameTags,
} from 'src/modules/tp-games/documents/gameTags'

import { GameTagUpdateInput } from './gameTagUpdate'

export const GameTagReorderMutationField = mutationField('gameTagUpdateOrder', {
  description: 'Change game tags order of games.',
  type: list('GameTag'),
  args: { data: nonNull(list(nonNull(GameTagUpdateInput))) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'tpgametags', action: 'update' }],
  },
  resolve: async (_, { data }) => {
    const payload = data.map((gameTag, index) => {
      return {
        updateOne: {
          filter: { _id: gameTag.id },
          update: { $set: { order: index + 1 } },
        },
      }
    })
    await bulkUpdateGameTags(payload)
    return await getAllTags()
  },
})
