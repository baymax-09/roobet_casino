import { mutationField, nonNull, list, inputObjectType } from 'nexus'

import { InventoryItemDAO } from 'src/modules/inventory/lib'

const InventoryItemsTransferInput = inputObjectType({
  name: 'InventoryItemsTransferInput',
  definition(type) {
    type.list.nonNull.objectId('itemIds', {
      auth: null,
      description:
        'List of item IDs that are to be transferred to another user.',
    })
    type.nonNull.uuid('destinationUserId', {
      auth: null,
      description:
        'The designated user that will receive the items from the transfer.',
    })
  },
})

export const InventoryItemsTransferMutationField = mutationField(
  'inventoryItemsTransfer',
  {
    description: 'Allows for transfers items from one user to another',
    type: nonNull(list(nonNull('UserInventoryItem'))),
    args: {
      data: nonNull(InventoryItemsTransferInput),
    },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'inventory', action: 'update' }],
    },
    resolve: async (_, { data: { itemIds, destinationUserId } }) => {
      const filter = { _id: { $in: itemIds } }
      const payload = [{ $set: { userId: destinationUserId } }]
      await InventoryItemDAO.updateUserItems({ filter, payload })
      const filterGetItems = { itemIds }
      return await InventoryItemDAO.getUserItemsByIds({
        filter: filterGetItems,
      })
    },
  },
)
