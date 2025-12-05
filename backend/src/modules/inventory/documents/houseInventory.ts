import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import {
  type InventoryItem,
  itemBuffTypeKeys,
  itemRarityKeys,
  itemUsageIntervalKeys,
} from './types'

export interface HouseInventoryItem extends InventoryItem {
  quantity: number
  hasInfiniteQuantity: boolean
}

export interface DBHouseInventoryItem extends InventoryItem {
  quantity: number
  hasInfiniteQuantity: boolean
}

export const HouseInventorySchema = new mongoose.Schema<DBHouseInventoryItem>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    rarity: {
      type: String,
      required: true,
      default: 'COMMON',
      enum: itemRarityKeys,
    },
    buff: {
      type: {
        type: String,
        required: true,
        enum: itemBuffTypeKeys,
        index: true,
      },
      buffSettings: {
        // All the various buff settings go in here
        unlockedEmotes: {
          type: [String],
          default: undefined,
          required: [
            function (this: DBHouseInventoryItem) {
              return this.buff.type === 'EMOTE'
            },
            'buff.buffSettings.unlockedEmotes is required if buff.type is EMOTE.',
          ],
        },
        games: {
          type: [String],
          default: undefined,
          required: [
            function (this: DBHouseInventoryItem) {
              return this.buff.type === 'FREE_BET'
            },
            'buff.buffSettings.games is required if buff.type is FREE_BET.',
          ],
        },
        freeBetAmount: {
          type: Number,
          required: [
            function (this: DBHouseInventoryItem) {
              return this.buff.type === 'FREE_BET'
            },
            'buff.buffSettings.freeBetAmount is required if buff.type is FREE_BET.',
          ],
        },
        freeBetType: {
          type: String,
          required: [
            function (this: DBHouseInventoryItem) {
              return this.buff.type === 'FREE_BET'
            },
            'buff.buffSettings.freeBetType is required if buff.type is FREE_BET.',
          ],
        },
        roowardsModifier: {
          type: Number,
          min: 0,
          required: [
            function (this: DBHouseInventoryItem) {
              return this.buff.type === 'ROOWARDS'
            },
            'buff.buffSettings.roowardsModifier is required if buff.type is ROOWARDS.',
          ],
        },
        freeSpins: {
          default: undefined,
          required: [
            function (this: DBHouseInventoryItem) {
              return this.buff.type === 'FREE_SPINS'
            },
            'buff.buffSettings.freeSpins is required if buff.type is FREE_SPINS.',
          ],
          type: [
            {
              tpGameAggregator: {
                type: String,
              },
              games: {
                default: [],
                type: [
                  {
                    identifier: { type: String },
                    pragmaticGameId: { type: String },
                  },
                ],
              },
              numberOfSpins: {
                type: Number,
                min: 0,
              },
              spinAmount: {
                type: Number,
                min: 0,
              },
            },
          ],
        },
      },
    },
    usageSettings: {
      usageInterval: {
        type: { type: String, enum: itemUsageIntervalKeys, index: true },
        frequency: { type: Number, min: 0, index: true, required: true },
      },
      hasLimitedUses: {
        type: Boolean,
        default: false,
        index: true,
        required: true,
      },
      consumedOnDepletion: {
        type: Boolean,
        default: false,
        index: true,
        required: true,
      },
      usesLeft: {
        type: Number,
        default: 0,
        min: 0,
        index: true,
        required: true,
      },
      lastUsedDate: { type: Date, index: true, default: null },
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    hasInfiniteQuantity: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true },
)

export const HouseInventoryModel = mongoose.model<DBHouseInventoryItem>(
  'house_inventory_items',
  HouseInventorySchema,
)

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: HouseInventoryModel.collection.name,
}
