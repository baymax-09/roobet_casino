import { queryField, list, nonNull } from 'nexus'

import { getAllEnabledTags } from 'src/modules/tp-games/documents/gameTags'

const TTL = 60 * 10 // 10 minutes.

export const GameTagsQueryField = queryField('gameTags', {
  type: nonNull(list('GameTag')),
  description: 'Get a list of Game Tags',
  cached: true,
  headers: {
    getHeaders: () => {
      return [
        {
          name: 'Cache-Control',
          value: `public, max-age=${TTL}`,
        },
      ]
    },
  },
  auth: {
    authenticated: false,
  },
  resolve: async () => {
    return await getAllEnabledTags()
  },
})
