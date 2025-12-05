import { type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

/*
 * REWARD
 */

// No DB prefix here because there is only ever a single type with no form of inheritance
export interface InventoryItemReward {
  _id: Types.ObjectId
  canBeClaimedOnlyOnce: boolean
  dropRate: number
  itemIds: Types.ObjectId[]
  hasInfiniteQuantity: boolean
  quantity: number
  name: string
}

export const InventoryItemRewardSchema =
  new mongoose.Schema<InventoryItemReward>(
    {
      canBeClaimedOnlyOnce: { type: Boolean, default: true, required: true },
      dropRate: { type: Number, min: 0, max: 100, default: 0, required: true },
      itemIds: { type: [mongoose.Schema.Types.ObjectId], required: true },
      hasInfiniteQuantity: { type: Boolean, required: true },
      quantity: { type: Number, min: 0, required: true },
      name: { type: String, required: true },
    },
    { timestamps: true },
  )

export const InventoryItemRewardModel = mongoose.model<InventoryItemReward>(
  'inventory_item_rewards',
  InventoryItemRewardSchema,
)

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: InventoryItemRewardModel.collection.name,
}
