import { queryField } from 'nexus'

import { getActiveSlotPotato } from 'src/modules/slotPotato/documents/slotPotato'

export const SlotPotatoActiveQueryField = queryField('slotPotatoActive', {
  description:
    'Get the active slot potato, this is the startDateTime - the start buffer (so the start buffer time)',
  type: 'SlotPotato',
  auth: {
    authenticated: false,
  },
  resolve: async () => await getActiveSlotPotato(),
})
