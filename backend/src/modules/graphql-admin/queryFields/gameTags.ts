import { queryField, list, nonNull } from 'nexus'

import { getAllTags } from 'src/modules/tp-games/documents/gameTags'

export const GameTagsNotCachedQueryField = queryField('gameTagsNotCached', {
  type: nonNull(list('GameTag')),
  description: 'Get a list of Game Tags',
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'tpgametags', action: 'read' }],
  },
  resolve: async () => {
    return await getAllTags()
  },
})
