import { mutationField, idArg, nonNull, list } from 'nexus'

import {
  enableTPGame,
  getActiveBlocks,
} from 'src/modules/tp-games/documents/blocks'

export const TPGameEnableMutationField = mutationField('enableTPGameMutation', {
  description: 'Enable a TP Game',
  type: list('TPGameBlock'),
  args: { id: nonNull(idArg()) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'tpgame_disables', action: 'delete' }],
  },
  resolve: async (_, { id }) => {
    await enableTPGame(id)
    return await getActiveBlocks()
  },
})
