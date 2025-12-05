import { queryField, list, nonNull } from 'nexus'

import { getActiveBlocks } from 'src/modules/tp-games/documents/blocks'

export const TPGameBlockQueryField = queryField('tpGameBlocks', {
  type: nonNull(list('TPGameBlock')),
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'tpgame_disables', action: 'read' }],
  },
  resolve: async () => await getActiveBlocks(),
})
