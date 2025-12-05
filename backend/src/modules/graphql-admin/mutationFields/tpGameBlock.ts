import { mutationField, nonNull, inputObjectType, list, enumType } from 'nexus'

import {
  blockTPGame,
  getActiveBlocks,
  TP_BLOCK_KEYS,
} from 'src/modules/tp-games/documents/blocks'

const TPBlockKey = enumType({
  name: 'TPBlockKey',
  members: TP_BLOCK_KEYS,
})

const TPGameBlockInput = inputObjectType({
  name: 'BlockTPGameInput',
  description: 'Add game to list of blocked games',
  definition(type) {
    type.nonNull.field('key', { type: TPBlockKey, auth: null })
    type.nonNull.string('value')
  },
})

export const TPGameBlockMutationField = mutationField('blockTPGameMutation', {
  description: 'Block (Disable) a TP Game',
  type: list('TPGameBlock'),
  args: {
    data: nonNull(TPGameBlockInput),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'tpgame_disables', action: 'create' }],
  },
  resolve: async (_, { data: block }) => {
    await blockTPGame(block)
    return await getActiveBlocks()
  },
})
