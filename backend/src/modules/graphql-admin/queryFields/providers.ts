import { queryField, list, nonNull } from 'nexus'

import { getAllProviders } from 'src/modules/tp-games/documents/games'

export const TPGamesProviderNamesQueryField = queryField(
  'tpGamesProviderNames',
  {
    type: nonNull(list('String')),
    description: 'Get a list of all providers for TP Games',
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'tpgames', action: 'read' }],
    },
    resolve: async () => (await getAllProviders()) ?? [],
  },
)
