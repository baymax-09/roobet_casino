import { GraphQLError } from 'graphql'
import { inputObjectType, mutationField, arg, nonNull } from 'nexus'

import { updateGamesStatus } from 'src/modules/tp-games/documents/games'

const TPGameUpdateApprovalStatusInputType = inputObjectType({
  name: 'TPGameStatusUpdateInputType',
  definition(type) {
    type.nonNull.list.nonNull.string('gameIdentifiers')
    type.nonNull.field('approvalStatus', {
      type: 'TPGameApprovalStatusEnumType',
      auth: null,
    })
  },
})

export const TPGameUpdateApprovalStatusMutationField = mutationField(
  'updateTpGameStatus',
  {
    type: 'Boolean',
    description: 'Update TP Games approval status',
    args: {
      input: nonNull(arg({ type: TPGameUpdateApprovalStatusInputType })),
    },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'tpgames', action: 'update' }],
    },
    async resolve(_, { input }) {
      const { gameIdentifiers, approvalStatus } = input

      try {
        await updateGamesStatus(gameIdentifiers, approvalStatus)
        return true
      } catch (error) {
        throw new GraphQLError(
          `Error updating approval status: ${error.message}`,
        )
      }
    },
  },
)
