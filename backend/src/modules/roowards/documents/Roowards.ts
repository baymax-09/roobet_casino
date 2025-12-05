import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'

import { isValidRoowardsTimespan } from '../lib'

interface DBRoowards {
  userId: string
  dAmount: number
  wAmount: number
  mAmount: number
  dLastClaimed: string
  wLastClaimed: string
  mLastClaimed: string
}

const RoowardsSchema = new mongoose.Schema<DBRoowards>({
  userId: { index: true, type: String },
  dAmount: { default: 0, type: Number },
  wAmount: { default: 0, type: Number },
  mAmount: { default: 0, type: Number },
  // @ts-expect-error string vs date again
  dLastClaimed: { type: Date, default: Date.now },
  // @ts-expect-error string vs date again
  wLastClaimed: { type: Date, default: Date.now },
  // @ts-expect-error string vs date again
  mLastClaimed: { type: Date, default: Date.now },
})

const RoowardsModel = mongoose.model<DBRoowards>('roowards', RoowardsSchema)

export const getRoowardsForUserId = async (
  userId: string,
): Promise<DBRoowards> => {
  return await RoowardsModel.findOneAndUpdate(
    { userId },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean()
}

export const addRakebackForUser = async (
  userId: string,
  dAmount: number,
  wAmount: number,
  mAmount: number,
) => {
  if (!userId) {
    return
  }
  return await RoowardsModel.findOneAndUpdate(
    { userId },
    {
      $inc: {
        dAmount: dAmount || 0,
        wAmount: wAmount || 0,
        mAmount: mAmount || 0,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
}

export const setRakebackZeroForUser = async (userId: string, type: string) => {
  if (!isValidRoowardsTimespan(type)) {
    return
  }

  return await RoowardsModel.findOneAndUpdate(
    { userId },
    {
      $set: {
        [`${type}Amount`]: 0,
        [`${type}LastClaimed`]: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: RoowardsModel.collection.name,
}
