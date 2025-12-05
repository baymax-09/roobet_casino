import { queryField, list, nonNull, stringArg } from 'nexus'

import { getGamesByAggregator } from 'src/modules/tp-games/documents/games'

export const TPGamesByAggregatorQueryField = queryField('tpGamesByAggregator', {
  type: nonNull(list('TPGameAdmin')),
  description: 'Get a list of TP Games based on the aggregator',
  args: {
    aggregator: nonNull(stringArg()),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'tpgames', action: 'read' }],
  },
  resolve: async (_, { aggregator }) => await getGamesByAggregator(aggregator),
})
