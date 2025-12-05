import { type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { type InventoryItem } from './types'

export interface DBArchivedInventoryItem {
  _id: Types.ObjectId
  userId?: string
  houseInventoryItemId: Types.ObjectId
  usesLeft: number
  lastUsedDate: Date | null
}

export interface ArchivedInventoryItem extends InventoryItem {
  userId?: string
  houseInventoryItemId: Types.ObjectId
}

export const ArchivedInventorySchema =
  new mongoose.Schema<DBArchivedInventoryItem>(
    {
      // This is not required in case inventory is archived directly from the house inventory
      userId: { type: String },
      houseInventoryItemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      lastUsedDate: { type: Date, default: null },
    },
    { timestamps: true },
  )

export const ArchivedInventoryModel = mongoose.model<DBArchivedInventoryItem>(
  'archived_inventory_items',
  ArchivedInventorySchema,
)

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: ArchivedInventoryModel.collection.name,
}
