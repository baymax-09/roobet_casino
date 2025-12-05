import { GraphQLError } from 'graphql'
import { inputObjectType, mutationField, nonNull } from 'nexus'

import { isBefore, addTimeInMs } from 'src/util/helpers/time'

import {
  createSlotPotato,
  updateSlotPotato,
  getAllCurrentOrUpcomingPotatoes,
  checkForEventConflicts,
} from 'src/modules/slotPotato/lib/slotPotato'
import { type SlotPotato } from 'src/modules/slotPotato/documents/slotPotato'
import { scheduleSlotPotatoEvent } from 'src/modules/slotPotato/util'

const SlotPotatoCreateGameInput = inputObjectType({
  name: 'SlotPotatoCreateGameInput',
  definition(type) {
    type.nonNull.objectId('gameId')
    type.nonNull.int('order', {
      auth: null,
      description: 'The order of the game in the slot potato event',
    })
  },
})

const SlotPotatoCreateInput = inputObjectType({
  name: 'SlotPotatoCreateInput',
  definition(type) {
    type.nonNull.date('startDateTime')
    type.nonNull.int('gameDuration')
    type.nonNull.boolean('disabled', {
      auth: null,
      default: false,
    })
    type.nonNull.list.nonNull.field('games', {
      auth: null,
      type: SlotPotatoCreateGameInput,
    })
  },
})

export const SlotPotatoCreateMutationField = mutationField('slotPotatoCreate', {
  description: 'Create a slot potato event',
  type: nonNull('SlotPotato'),
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'slot_potato', action: 'create' }],
  },
  args: { data: nonNull(SlotPotatoCreateInput) },
  resolve: async (_, { data }) => {
    let slotPotato: SlotPotato

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
    const potatoesToCheck = await getAllCurrentOrUpcomingPotatoes()
    const hasEventConflict = await checkForEventConflicts(data, potatoesToCheck)
    if (hasEventConflict) {
      throw new GraphQLError(
        'New Slot Potato has time conflict with another slot potato',
        {},
      )
    }

    try {
      slotPotato = await createSlotPotato(data)
    } catch (err) {
      throw new GraphQLError('Failed to create slot potato event', {
        originalError: err,
      })
    }
    const startEventId = await scheduleSlotPotatoEvent(slotPotato)
    await updateSlotPotato(slotPotato._id, { startEventId })
    return slotPotato
  },
})
