import { mutationField, nonNull, inputObjectType } from 'nexus'

import { InventoryItemDAO } from 'src/modules/inventory/lib'

const InventoryItemsAddToUserInput = inputObjectType({
  name: 'InventoryItemsAddToUserInput',
  definition(type) {
    type.nonNull.objectId('itemId', {
      auth: null,
      description: 'Item ID that needs to be added to user.',
    })
    type.nonNull.uuid('userId', {
      auth: null,
      description: 'The user ID that the items will be transferred to.',
    })
    type.nonNull.int('quantity', {
      auth: null,
      description:
        'The quantity to reduce the house items by, and added to user.',
      default: 1,
    })
    type.nonNull.string('issuerId', {
      auth: null,
      description:
        'The ID of the issuer of the item, ACP user ID or System Name.',
    })
    type.nonNull.string('reason', {
      auth: null,
      description: 'The reason the item is being issued to the user.',
    })
  },
})

export const InventoryItemsAddToUserMutationField = mutationField(
  'inventoryItemsAddToUser',
  {
    description:
      'Add item(s) to a specific user and removes them from house inventory',
    type: nonNull('HouseInventoryItem'),
    args: {
      data: nonNull(InventoryItemsAddToUserInput),
    },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'inventory', action: 'update' }],
    },
    resolve: async (_, { data }) => {
      return await InventoryItemDAO.addItemsToUserInventory(data)
    },
  },
)
