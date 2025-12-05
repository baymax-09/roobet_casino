import { mutationField, nonNull, inputObjectType } from 'nexus'

import { InventoryItemRewardDAO } from 'src/modules/inventory/lib'

const InventoryItemRewardCreateInput = inputObjectType({
  name: 'InventoryItemRewardCreateInput',
  definition(type) {
    type.nonNull.string('name', {
      auth: null,
      description: 'The name of this reward.',
    })
    type.nonNull.float('dropRate', {
      auth: null,
      description: 'The percent drop rate for this reward, between 0 and 100.',
    })
    type.nonNull.int('quantity', {
      auth: null,
      description:
        'The amount of times a reward can be claimed by users. Set to null if this is infinite.',
    })
    type.nonNull.boolean('hasInfiniteQuantity', {
      auth: null,
      description: 'Set to true if the reward has infinite quantity.',
    })
    type.nonNull.boolean('canBeClaimedOnlyOnce', {
      auth: null,
      description:
        'If this is set to true, then a user will only get this reward once upon meeting criteria.',
    })
    type.nonNull.list.nonNull.objectId('itemIds', {
      auth: null,
      description:
        'The list of inventory item ids rewarded by this reward configuration.',
    })
  },
})

export const InventoryItemRewardCreateMutationField = mutationField(
  'inventoryItemRewardCreateMutation',
  {
    description: 'Create a item reward.',
    type: nonNull('InventoryItemReward'),
    args: { data: nonNull(InventoryItemRewardCreateInput) },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'inventory', action: 'create' }],
    },
    resolve: async (_, { data }) => {
      return await InventoryItemRewardDAO.createItemReward({ itemReward: data })
    },
  },
)
