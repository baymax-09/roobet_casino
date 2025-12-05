import { mutationField, nonNull, inputObjectType } from 'nexus'

import {
  InventoryItemDAO,
  type HouseInventoryItem,
} from 'src/modules/inventory/lib'

const InventoryItemCreateInput = inputObjectType({
  name: 'InventoryItemCreateInput',
  definition(type) {
    type.nonNull.int('quantity', {
      auth: null,
      description:
        'The quantity of this particular item in the house inventory.',
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
    type.nonNull.boolean('hasInfiniteQuantity', {
      auth: null,
      description: 'The item has infinite quantity.',
    })
  },
})

export const InventoryItemCreateMutationField = mutationField(
  'inventoryItemCreateMutation',
  {
    description: 'Create an inventory item within the house inventory.',
    type: nonNull('HouseInventoryItem'),
    args: { data: nonNull(InventoryItemCreateInput) },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'inventory', action: 'create' }],
    },
    resolve: async (_, { data }) => {
      const createPayload: Omit<HouseInventoryItem, '_id'> = {
        ...data,
        usageSettings: {
          ...data.usageSettings,
          lastUsedDate: null,
        },
      }
      return await InventoryItemDAO.createHouseItem({ item: createPayload })
    },
  },
)
