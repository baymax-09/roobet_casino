import { type Types } from 'mongoose'

import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

export interface RippleTag {
  _id: Types.ObjectId
  userId: string
  destinationTag: number
}

type CreateRippleTag = Omit<RippleTag, '_id'>

const RippleTagSchema = new megaloMongo.Schema<RippleTag>(
  {
    userId: {
      type: String,
      index: true,
      unique: true,
      required: true,
    },
    destinationTag: {
      type: Number,
      index: true,
      unique: true,
      required: true,
    },
  },
  { timestamps: true },
)

const RippleTagModel = megaloMongo.model<RippleTag>(
  'ripple_tags',
  RippleTagSchema,
)

export async function getRippleTag(
  destinationTag: number,
): Promise<RippleTag | null> {
  return await RippleTagModel.findOne({ destinationTag }).lean<RippleTag>()
}

export async function getRippleTagByUserId(
  userId: string,
): Promise<RippleTag | null> {
  return await RippleTagModel.findOne({ userId }).lean<RippleTag>()
}

export async function createUserRippleTag(
  rippleTag: CreateRippleTag,
): Promise<RippleTag> {
  return await (await RippleTagModel.create(rippleTag)).toObject()
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: RippleTagModel.collection.name,
}
