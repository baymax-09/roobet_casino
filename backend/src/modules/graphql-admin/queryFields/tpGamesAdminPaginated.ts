import { queryField, intArg, nonNull } from 'nexus'
import {
  tableSearchTPGames,
  type GamesFilter,
} from 'src/modules/tp-games/documents/games'
import { TPGamesFilterType } from '../types/tpGameAdminPaginated'

export const TPGamesAdminGetPaginatedQueryField = queryField(
  'tpGamesAdminPaginated',
  {
    type: 'TPGameAdminPage',
    description: 'Get a list of all TP Games',
    args: {
      limit: nonNull(intArg({ default: 25 })),
      page: nonNull(intArg({ default: 0 })),
      filterObj: TPGamesFilterType,
    },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'tpgames', action: 'read' }],
    },
    resolve: async (_, { limit, page, filterObj }) => {
      const filter: GamesFilter = filterObj
        ? Object.fromEntries(
            Object.entries(filterObj).filter(([_, value]) => value != null),
          )
        : {}
      return (await tableSearchTPGames(limit, page, filter)) || []
    },
  },
)
