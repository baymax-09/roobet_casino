import { queryField, list, nonNull, stringArg, booleanArg } from 'nexus'

import { getAllGames } from 'src/modules/tp-games/documents/games'

export const TPGamesGetAllQueryField = queryField('tpGamesGetAll', {
  type: nonNull(list('TPGameAdmin')),
  description: 'Get a list of all TP Games',
  args: {
    approvalStatus: stringArg(),
    disabledGames: booleanArg(),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'tpgames', action: 'read' }],
  },
  resolve: async (_, { approvalStatus, disabledGames }) =>
    (await getAllGames(approvalStatus, disabledGames)) ?? [],
})
