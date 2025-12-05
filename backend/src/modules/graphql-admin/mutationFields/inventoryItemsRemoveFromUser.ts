import { mutationField, nonNull, list, inputObjectType } from 'nexus'
import { GraphQLError } from 'graphql'

import { removeItemsFromUserInventory } from 'src/modules/inventory/documents/items'

const InventoryItemRemoveFromUserInput = inputObjectType({
  name: 'InventoryItemRemoveFromUserInput',
  definition(type) {
    type.nonNull.list.nonNull.id('itemIds', {
      auth: null,
      description: 'The ids of the user inventory items to remove.',
    })
  },
})
export const InventoryItemsRemoveFromUserMutationField = mutationField(
  'inventoryItemsRemoveFromUser',
  {
    description:
      'Removes item(s) from user and return the item(s) to the house inventory',
    type: nonNull(list(nonNull('HouseInventoryItem'))),
    args: {
      data: nonNull(InventoryItemRemoveFromUserInput),
    },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'inventory', action: 'update' }],
    },
    resolve: async (_, { data }) => {
      if (!data.itemIds.length) {
        throw new GraphQLError('Must provide IDs', {})
      }
      return await removeItemsFromUserInventory(data.itemIds)
    },
  },
)
