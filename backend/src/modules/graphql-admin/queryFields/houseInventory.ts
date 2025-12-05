import { queryField, list, nonNull, stringArg } from 'nexus'

import { InventoryItemDAO } from 'src/modules/inventory/lib'

export const HouseInventoryQueryField = queryField('houseInventory', {
  type: nonNull(list('HouseInventoryItem')),
  description: `
    Fetches the list of items in the house inventory.
  `,
  args: {
    buffTypes: list(nonNull(stringArg())),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'inventory', action: 'read' }],
  },
  resolve: async (_, { buffTypes }) => {
    const filter = { buffTypes }
    return await InventoryItemDAO.getHouseInventoryItems({ filter })
  },
})
