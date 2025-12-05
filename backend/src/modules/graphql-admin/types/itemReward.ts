import { objectType } from 'nexus'
import path from 'path'

import { InventoryItemDAO } from 'src/modules/inventory/lib'

export const ItemRewardType = objectType({
  name: 'InventoryItemReward',
  description: 'A set of items that can be rewarded from a given criteria.',
  sourceType: {
    module: path.resolve(__dirname),
    export: 'DBInventoryItemReward',
  },
  definition(type) {
    type.nonNull.objectId('id', {
      auth: null,
      description: 'The unique identifier of this inventory item reward.',
      resolve: ({ _id }) => _id,
    })
    type.nonNull.string('name', {
      auth: null,
      description: 'The name of this reward.',
    })
    type.nonNull.float('dropRate', {
      auth: null,
      description: 'The percent drop rate for this reward, between 0 and 100.',
    })
    type.nonNull.boolean('hasInfiniteQuantity', {
      auth: null,
      description: 'Set to true if the reward has infinite quantity.',
    })
    type.nonNull.int('quantity', {
      auth: null,
      description: 'The amount of times a reward can be claimed by users.',
    })
    type.nonNull.boolean('canBeClaimedOnlyOnce', {
      auth: null,
      description:
        'If this is set to true, then a user will only get this reward once upon meeting criteria.',
    })
    type.nonNull.list.nonNull.id('itemIds', {
      auth: null,
      description:
        'The ids of the inventory items rewarded by this reward configuration.',
    })
    type.nonNull.list.nonNull.field('items', {
      auth: null,
      type: 'HouseInventoryItem',
      description:
        'The list of inventory items rewarded by this reward configuration.',
      resolve: async ({ itemIds }) => {
        return await InventoryItemDAO.getHouseItemsByItemIds({
          filter: { itemIds },
        })
      },
    })
  },
})
