import { mutationField, nonNull, inputObjectType } from 'nexus'
import { GraphQLError } from 'graphql'

import { cancelScheduledEvent } from 'src/util/eventScheduler'
import { isBefore, addTimeInMs } from 'src/util/helpers/time'

import {
  updateSlotPotato,
  getAllCurrentOrUpcomingPotatoes,
  checkForEventConflicts,
} from 'src/modules/slotPotato/lib/slotPotato'
import { scheduleSlotPotatoEvent } from 'src/modules/slotPotato/util'

const SlotPotatoGameUpdateInput = inputObjectType({
  name: 'SlotPotatoGameUpdateInput',
  definition(type) {
    type.nonNull.objectId('gameId')
    type.nonNull.int('order', {
      auth: null,
      description: 'The order of the game in the slot potato event',
    })
  },
})

const SlotPotatoUpdateInput = inputObjectType({
  name: 'SlotPotatoUpdateInput',
  definition(type) {
    type.nonNull.id('id')
    type.date('startDateTime')
    type.int('gameDuration')
    type.boolean('disabled')
    type.list.nonNull.field('games', {
      auth: null,
      type: SlotPotatoGameUpdateInput,
    })
  },
})

export const SlotPotatoUpdateMutationField = mutationField('slotPotatoUpdate', {
  description: 'Update an existing slot potato event',
  type: 'SlotPotato',
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'slot_potato', action: 'update' }],
  },
  args: { data: nonNull(SlotPotatoUpdateInput) },
  resolve: async (_, { data }) => {
    if (!data.games?.length) {
      throw new GraphQLError('Slot Potatoes require games.', {})
    }

    if (!data.startDateTime) {
      throw new GraphQLError('Slot Potatoes require a start date.', {})
    }

    if (isBefore(data.startDateTime, addTimeInMs(1000 * 5))) {
      throw new GraphQLError(
        'Slot Potatoes must start over 5 minutes from now.',
        {},
      )
    }

    if (data?.startDateTime && data?.games && data?.gameDuration) {
      const dataToValidate = {
        startDateTime: data.startDateTime,
        gameDuration: data.gameDuration,
        games: data.games,
      }
      const upcomingPotatoes = await getAllCurrentOrUpcomingPotatoes()
      const potatoesToCheck = upcomingPotatoes.filter(
        potato => potato._id.toString() !== data.id,
      )
      const hasEventConflict = await checkForEventConflicts(
        dataToValidate,
        potatoesToCheck,
      )
      if (hasEventConflict) {
        throw new GraphQLError(
          'New Slot Potato has time conflict with another slot potato',
          {},
        )
      }
    }

    const updatedSlotPotato = await updateSlotPotato(data.id, {
      startDateTime: data.startDateTime ?? undefined,
      gameDuration: data.gameDuration ?? undefined,
      games: data.games ?? undefined,
    })

    if (updatedSlotPotato?.startEventId) {
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
