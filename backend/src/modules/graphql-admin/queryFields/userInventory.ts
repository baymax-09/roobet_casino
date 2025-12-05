import { queryField, list, nonNull, stringArg } from 'nexus'

import { uuidArg } from 'src/util/graphql'

import { InventoryItemDAO } from 'src/modules/inventory/lib'

export const UserInventoryQueryField = queryField('userInventory', {
  type: nonNull(list('UserInventoryItem')),
  description: `
    Fetches the list of items in a user's inventory.
  `,
  args: {
    userId: nonNull(
      uuidArg({
        description: 'The UUID of the user.',
      }),
    ),
    buffTypes: list(stringArg()),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'inventory', action: 'read' }],
  },
  resolve: async (_, { userId, buffTypes }) => {
    const filter = { type: 'user', userId, buffTypes }
    return await InventoryItemDAO.getUserInventoryItems({ filter })
  },
})
