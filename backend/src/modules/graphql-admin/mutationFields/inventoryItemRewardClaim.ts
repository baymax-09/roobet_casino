import { mutationField, nonNull, inputObjectType } from 'nexus'
import { GraphQLError } from 'graphql'

import { InventoryItemRewardDAO } from 'src/modules/inventory/lib'

const InventoryItemRewardClaimInput = inputObjectType({
  name: 'InventoryItemRewardClaimInput',
  definition(type) {
    type.nonNull.objectId('rewardId', {
      auth: null,
      description: 'The id of the reward to claim.',
    })
  },
})

export const InventoryItemRewardClaimMutationField = mutationField(
  'inventoryItemRewardClaim',
  {
    description:
      'Endpoint to claim a reward. Returns true if the reward was successfully claimed, and false if not.',
    type: nonNull('Boolean'),
    args: {
      data: nonNull(InventoryItemRewardClaimInput),
    },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'inventory', action: 'update' }],
    },
    resolve: async (_, { data: { rewardId } }, { user }) => {
      if (!user) {
        throw new GraphQLError('No user.')
      }
      return await InventoryItemRewardDAO.claimReward({
        userId: user.id,
        rewardId: rewardId.toString(),
      })
    },
  },
)
