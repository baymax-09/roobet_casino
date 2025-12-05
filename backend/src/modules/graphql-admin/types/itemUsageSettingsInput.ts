import { inputObjectType } from 'nexus'

const ItemUsageIntervalInput = inputObjectType({
  name: 'ItemUsageIntervalInput',
  definition(type) {
    type.field('type', {
      auth: null,
      description: 'The interval type (e.g., HOURS, DAYS, etc).',
      type: 'ItemUsageIntervalType',
    })
    type.nonNull.int('frequency', {
      auth: null,
      description:
        "The frequency per interval type that this item's buff may be used.",
    })
  },
})

export const ItemUsageInputType = inputObjectType({
  name: 'ItemUsageInput',
  definition(type) {
    type.field('usageInterval', {
      auth: null,
      description:
        'The item usage interval. If this is not assigned, then the item can be used at any time.',
      type: ItemUsageIntervalInput,
    })
    type.nonNull.boolean('hasLimitedUses', {
      auth: null,
      description:
        'If this is set to true, then the item may only be used a set amount of times, as determined by the field usesLeft.',
    })
    type.nonNull.boolean('consumedOnDepletion', {
      auth: null,
      description:
        'If this is set to true, then the item will be deleted if `hasLimitedUses` is true and `usesLeft` is 0.',
    })
    type.nonNull.int('usesLeft', {
      auth: null,
      description: 'The uses an item has left if usage is limited.',
    })
    type.date('lastUsedDate', {
      auth: null,
      description: "Stores the last time an item's buff was invoked.",
    })
  },
})
