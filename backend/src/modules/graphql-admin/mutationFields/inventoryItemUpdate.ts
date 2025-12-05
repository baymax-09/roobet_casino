import { GraphQLError } from 'graphql'
import { mutationField, inputObjectType, nonNull } from 'nexus'

import { InventoryItemDAO } from 'src/modules/inventory/lib'

const InventoryItemUpdateInput = inputObjectType({
  name: 'InventoryItemUpdateInput',
  definition(type) {
    type.nonNull.int('quantity', {
      auth: null,
      description:
        'The quantity of this particular item in the house inventory.',
    })
    type.nonNull.boolean('hasInfiniteQuantity', {
      auth: null,
      description: 'Set to true if the item has infinite quantity.',
    })
    type.nonNull.string('name', {
      auth: null,
      description: 'The publicly displayed name of the inventory item.',
    })
    type.nonNull.string('description', {
      auth: null,
      description: 'The publicly displayed description of the inventory item.',
    })
    type.nonNull.string('imageUrl', {
      auth: null,
      description: 'The publicly displayed image for the inventory item.',
    })
    type.nonNull.field('rarity', {
      auth: null,
      description: 'The rarity of the item.',
      type: 'ItemRarity',
    })
    type.nonNull.field('buff', {
      auth: null,
      description: 'The buff used when invoking this item.',
      type: 'ItemBuffInput',
    })
    type.nonNull.field('usageSettings', {
      auth: null,
      description:
        'The usage setting of the buff used when invoking this item.',
      type: 'ItemUsageInput',
    })
    type.nonNull.id('id', {
      auth: null,
      description: 'The id of the item that is to be updated.',
    })
    type.nonNull.boolean('hasInfiniteQuantity', {
      auth: null,
      description: 'The item has infinite quantity.',
    })
  },
})

export const InventoryItemUpdateMutationField = mutationField(
  'inventoryItemUpdateMutation',
  {
    description: 'Update an inventory item within the house inventory.',
    type: nonNull('HouseInventoryItem'),
    args: {
      data: nonNull(InventoryItemUpdateInput),
    },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'inventory', action: 'update' }],
    },
    resolve: async (_, { data }) => {
      const { id, ...payload } = data
      const houseItem = await InventoryItemDAO.updateHouseItem({
        filter: { itemId: id },
        payload,
      })
      if (!houseItem) {
        throw new GraphQLError('Error updating house item', {})
      }
      return houseItem
    },
  },
)
