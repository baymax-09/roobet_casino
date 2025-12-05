import { queryField, list, nonNull } from 'nexus'

import { getAllApprovedAndEnabledGames } from 'src/modules/tp-games/documents/games'

const TTL = 60 * 60 // 60 minutes.

export const TPGamesGetAllProductQueryField = queryField('tpGamesGetAll', {
  type: nonNull(list('TPGame')),
  description: `
    Gets TP Games with only the essential fields.
  `,
  auth: {
    authenticated: false,
  },
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
  resolve: async () => {
    // TODO: Try adding Redis response caching into a plugin and test performance.
    return getAllApprovedAndEnabledGames()
  },
})
