import { mutationField, nonNull, inputObjectType } from 'nexus'

import { cancelScheduledEvent } from 'src/util/eventScheduler'
import { isBefore, addTimeInMs } from 'src/util/helpers/time'

import { updateSlotPotato } from 'src/modules/slotPotato/documents/slotPotato'
import { scheduleSlotPotatoEvent } from 'src/modules/slotPotato/util'

const SlotPotatoEnableInput = inputObjectType({
  name: 'SlotPotatoEnableInput',
  definition(type) {
    type.nonNull.id('id')
  },
})

export const SlotPotatoEnableMutationField = mutationField('slotPotatoEnable', {
  description: 'Enable a currently disabled slot potato event',
  type: 'SlotPotato',
  args: {
    data: nonNull(SlotPotatoEnableInput),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'slot_potato', action: 'update' }],
  },
  resolve: async (_, { data }) => {
    const updatedSlotPotato = await updateSlotPotato(data.id, {
      disabled: false,
    })
    const isTooLateForEvent = updatedSlotPotato?.startDateTime
      ? isBefore(updatedSlotPotato.startDateTime, addTimeInMs(1000 * 5))
      : true

    if (!isTooLateForEvent && updatedSlotPotato?.startEventId) {
      // cancel any currently queued events
      await cancelScheduledEvent(updatedSlotPotato.startEventId)
      if (!updatedSlotPotato.disabled) {
        // if the event is not being disabled, we requeue the event with updated information
        const startEventId = await scheduleSlotPotatoEvent(updatedSlotPotato)
        // make sure to update event id
        await updateSlotPotato(data.id, { startEventId })
      }
    }

    return updatedSlotPotato
  },
})
