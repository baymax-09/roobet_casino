import { objectType, enumType } from 'nexus'

export const ItemUsage = objectType({
  name: 'ItemUsage',
  description:
    "The settings for how frequently an item's buff may be used, and usage limitations.",
  definition(type) {
    type.nonNull.field('usageInterval', {
      auth: null,
      description:
        'The ItemUsageInterval. If this is not assigned, then the item can be used at any time.',
      type: ItemUsageInterval,
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
    type.int('usesLeft', {
      auth: null,
      description: 'The uses an item has left if usage is limited.',
    })
    type.date('lastUsedDate', {
      auth: null,
      description: "Stores the last time an item's buff was invoked.",
    })
  },
})

const ItemUsageIntervalType = enumType({
  name: 'ItemUsageIntervalType',
  description: 'The time interval delay between item usages.',
  members: ['HOURS', 'DAYS', 'WEEKS', 'MONTHS'],
})

const ItemUsageInterval = objectType({
  name: 'ItemUsageInterval',
  description:
    'How frequently an item can be used. e.g., every 3 hours would be: { type: HOURS, frequency: 3 }',
  definition(type) {
    type.field('type', {
      auth: null,
      description: 'The interval type (e.g., HOURS, DAYS, etc).',
      type: ItemUsageIntervalType,
    })
    type.nonNull.int('frequency', {
      auth: null,
      description:
        "The frequency per interval type that this item's buff may be used.",
    })
  },
})
