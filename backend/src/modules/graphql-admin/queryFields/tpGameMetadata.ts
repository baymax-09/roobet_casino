import { queryField } from 'nexus'

import { getDistinctTPGameMetadata } from 'src/modules/tp-games/documents/games'

export const TPGameMetadataQueryField = queryField('tpGameMetadata', {
  type: 'TPGameMetadata',
  description: 'Get All Categories, Aggregators and Providers',
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'tpgames', action: 'read' }],
  },
  resolve: async () => {
    return await getDistinctTPGameMetadata()
  },
})
