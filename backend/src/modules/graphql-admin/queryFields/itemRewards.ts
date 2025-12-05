import { queryField, list, nonNull } from 'nexus'

import { InventoryItemRewardDAO } from 'src/modules/inventory/lib'

export const InventoryItemRewardsQueryField = queryField(
  'inventoryItemRewards',
  {
    type: nonNull(list('InventoryItemReward')),
    description: 'Fetches the list of inventory item rewards.',
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'inventory', action: 'read' }],
    },
    resolve: async () => {
      return await InventoryItemRewardDAO.getInventoryItemRewards()
    },
  },
)
