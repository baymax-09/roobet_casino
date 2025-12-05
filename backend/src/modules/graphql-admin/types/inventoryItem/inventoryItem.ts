import { objectType, enumType, interfaceType } from 'nexus'
import path from 'path'

import { isActive } from 'src/modules/inventory/documents/aggregationSteps'

import { ItemUsage } from './inventoryItemUsage'

const ItemRarity = enumType({
  name: 'ItemRarity',
  description: 'The rarity of a given inventory item.',
  members: ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'],
})

const InventoryItem = interfaceType({
  name: 'InventoryItem',
  sourceType: {
    module: path.resolve(__dirname),
    export: 'DBInventoryItem',
  },
  description:
    'Items stored in player or house inventories, used for Avatars, buffs, Roowards, etc.',
  definition(type) {
    type.nonNull.objectId('id', {
      auth: null,
      description: 'The unique identifier of this inventory item.',
      resolve: ({ _id }) => _id,
    })
    type.nonNull.string('name', {
      auth: null,
      description: 'The publicly displayed name of the inventory item.',
    })
    type.nonNull.string('description', {
      auth: null,
      description: 'The publicly displayed description of the inventory item.',
    })
    type.nonNull.string('imageUrl', {
      auth: null,
      description: 'The publicly displayed image for the inventory item.',
    })
    type.nonNull.field('rarity', {
      auth: null,
      description: 'The rarity of the item.',
      type: ItemRarity,
    })
    type.nonNull.field('buff', {
      auth: null,
      description: 'The buff used when invoking this item.',
      type: 'ItemBuff',
    })
    type.nonNull.field('usageSettings', {
      auth: null,
      description:
        'The usage setting of the buff used when invoking this item.',
      type: ItemUsage,
    })
    type.nonNull.boolean('isActive', {
      auth: null,
      description: 'Describes whether or not the buff on this item is active.',
      resolve: ({ usageSettings }) => {
        return isActive(usageSettings)
      },
    })
  },
})

export const HouseInventoryItemType = objectType({
  name: 'HouseInventoryItem',
  sourceType: {
    module: path.resolve(__dirname),
    export: 'DBHouseInventoryItem',
  },
  isTypeOf(data) {
    return Boolean('quantity' in data)
  },
  definition(type) {
    type.implements(InventoryItem)
    type.nonNull.int('quantity', {
      auth: null,
      description:
        'The number of duplicates in the stack in the house inventory for this item. Will resolve to 0 if hasInfiniteQuantity is true.',
      resolve: ({ hasInfiniteQuantity, quantity }) =>
        hasInfiniteQuantity ? 0 : quantity,
    })
    type.nonNull.boolean('hasInfiniteQuantity', {
      auth: null,
      description: 'The item has infinite quantity.',
    })
  },
})

export const UserInventoryItemType = objectType({
  name: 'UserInventoryItem',
  sourceType: {
    module: path.resolve(__dirname),
    export: 'DBUserInventoryItem',
  },
  isTypeOf(data) {
    return Boolean('userId' in data)
  },
  definition(type) {
    type.implements(InventoryItem)
    type.nonNull.uuid('userId', {
      auth: null,
      description: 'The userId of the user inventory item.',
    })
    type.nonNull.objectId('houseInventoryItemId', {
      auth: null,
      description: 'The userId of the user inventory item.',
    })
  },
})

export const ArchivedInventoryItemType = objectType({
  name: 'ArchivedInventoryItem',
  sourceType: {
    module: path.resolve(__dirname),
    export: 'DBArchivedInventoryItem',
  },
  isTypeOf(data) {
    return Boolean('archived' in data)
  },
  definition(type) {
    type.implements(InventoryItem)
    type.uuid('userId', {
      auth: null,
      description: 'The userId of the user inventory item.',
    })
    type.nonNull.objectId('houseInventoryItemId', {
      auth: null,
      description:
        'Signifies what house item this inventory item originated from.',
    })
  },
})
