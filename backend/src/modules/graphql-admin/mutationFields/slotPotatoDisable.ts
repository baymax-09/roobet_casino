import { mutationField, nonNull, inputObjectType } from 'nexus'

import { io } from 'src/system'
import { cancelScheduledEvent } from 'src/util/eventScheduler'

import { updateSlotPotato } from 'src/modules/slotPotato/documents/slotPotato'
import { slotPotatoLogger } from 'src/modules/slotPotato/lib/logger'

const SlotPotatoDisableInput = inputObjectType({
  name: 'SlotPotatoDisableInput',
  definition(type) {
    type.nonNull.id('id')
  },
})

export const SlotPotatoDisableMutationField = mutationField(
  'slotPotatoDisable',
  {
    description: 'Disable a currently enabled slot potato event',
    type: 'SlotPotato',
    args: {
      data: nonNull(SlotPotatoDisableInput),
    },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'slot_potato', action: 'update' }],
    },
    resolve: async (_, { data }, { user }) => {
      const updatedSlotPotato = await updateSlotPotato(data.id, {
        disabled: true,
      })

      if (updatedSlotPotato?.startEventId) {
        // cancel any currently queued events
        await cancelScheduledEvent(updatedSlotPotato.startEventId)
        // Log and emit an event to FE that the event has been cancelled
        slotPotatoLogger('SlotPotatoDisableMutationField', {
          userId: user?.id ?? null,
        }).info(
          `Cancelling active slot potato event id: ${updatedSlotPotato._id.toString()}`,
        )
        io.emit('slotPotatoEventCancelled', {
          id: updatedSlotPotato._id.toString(),
        })
      }

      return updatedSlotPotato
    },
  },
)
