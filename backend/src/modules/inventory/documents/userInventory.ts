import { type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { type InventoryItem } from './types'

export interface DBUserInventoryItem {
  _id: Types.ObjectId
  userId: string
  houseInventoryItemId: Types.ObjectId
  usesLeft: number
  lastUsedDate: Date | null
}

export interface UserInventoryItem extends InventoryItem {
  userId: string
  houseInventoryItemId: Types.ObjectId
}

export const UserInventorySchema = new mongoose.Schema<DBUserInventoryItem>(
  {
    usesLeft: { type: Number, required: true, default: 0 },
    lastUsedDate: { type: Date, default: null },
    userId: { type: String, required: true },
    houseInventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true },
)

export const UserInventoryModel = mongoose.model<DBUserInventoryItem>(
  'user_inventory_items',
  UserInventorySchema,
)

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: UserInventoryModel.collection.name,
}
