import { idArg, list, nonNull, queryField } from 'nexus'

import {
  getAllSlotPotatoes,
  getSlotPotatoesByIds,
} from 'src/modules/slotPotato/lib/slotPotato'

export const SlotPotatoQueryField = queryField('slotPotatoes', {
  description: 'Get slot potato events',
  type: list('SlotPotato'),
  args: { ids: list(nonNull(idArg())) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'slot_potato', action: 'read' }],
  },
  resolve: async (_, { ids }, __) => {
    if (!ids) {
      return await getAllSlotPotatoes()
    }

    return await getSlotPotatoesByIds(ids)
  },
})
