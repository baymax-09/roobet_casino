import { type Types } from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { MongoErrorCodes, mongoose } from 'src/system'

interface BaseSFAction {
  action: string
  action_id: string
  amount: number
  /** as in the ID of the Softswiss "game session"(e.g. 28k-crfp1y8v-14565296764) */
  game_id: string
  /** as in, which Softswiss game(e.g. softswiss:HalloweenBonanza) */
  game: string
  userId: string
}

interface SFAction extends BaseSFAction {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
  attempts: number
}

const SFActionSchema = new mongoose.Schema<SFAction>(
  {
    action: { type: String },
    action_id: { type: String, index: true, unique: true },
    amount: { type: Number, default: 0 },
    game_id: { type: String },
    game: { type: String },
    userId: { type: String },
    attempts: { type: Number, required: true, default: 1 },
  },
  { timestamps: true },
)

SFActionSchema.index({ updatedAt: 1 }, { expires: '3d' })

const SFActionModel = mongoose.model<SFAction>('sf_actions', SFActionSchema)

export async function updateAction(
  action_id: string,
  payload: Partial<Omit<BaseSFAction, 'action_id'>>,
) {
  const results = await SFActionModel.findOneAndUpdate({ action_id }, payload)
  return results
}

export async function getActionByActionId(action_id: string) {
  return await SFActionModel.findOne({ action_id }).lean()
}

export const touchAction = async (
  action_id: string,
  payload: Omit<BaseSFAction, 'action_id'>,
): Promise<{ action: SFAction | undefined; existed: boolean }> => {
  try {
    const action = await SFActionModel.create({ ...payload, action_id })
    return { action, existed: false }
  } catch (error) {
    if (error.code === MongoErrorCodes.DUPLICATE_KEY) {
      const action = await SFActionModel.findOneAndUpdate(
        { action_id },
        { $inc: { attempts: 1 } },
        { new: true },
      ).lean()
      return { action: action ?? undefined, existed: true }
    }
    // If we couldn't make an action record, why couldn't we fetch one?
    return { action: undefined, existed: true }
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: SFActionModel.collection.name,
}
