import { type Require_id, type Types } from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { type BalanceType } from 'src/modules/user/types/Balance'
import { MongoErrorCodes, mongoose } from 'src/system'

export const HacksawActionTypes = [
  'Balance',
  'Authenticate',
  'Bet',
  'Win',
  'Rollback',
  'EndSession',
] as const

export type HacksawActionType = (typeof HacksawActionTypes)[number]
export type StateMachineHacksawAction = Exclude<
  HacksawActionType,
  'Balance' | 'Authenticate' | 'EndSession'
>
interface TouchActionResult {
  action: HacksawActionDocument | undefined
  existed: boolean
}

export interface BaseHacksawAction {
  action: HacksawActionType
  roundId: string
  transactionId: string
  userId?: string
  betIdentifier?: string
  externalTransactionId?: string
  gameIdentifier?: string
  balanceType?: BalanceType
  amount: number
  targetActionBetIdentifier?: string
  targetActionType?: string
}

export interface HacksawAction extends BaseHacksawAction {
  createdAt: Date
  updatedAt: Date
  attempts: number
}

export interface HacksawActionDocument extends HacksawAction {
  _id: Types.ObjectId
}

const HacksawActionSchema = new mongoose.Schema<HacksawAction>(
  {
    roundId: { type: String, required: true },
    action: { type: String, enum: HacksawActionTypes, required: true },
    gameIdentifier: { type: String },
    balanceType: { type: String },
    transactionId: { type: String },
    amount: { type: Number },
    attempts: { type: Number, default: 1, required: true },

    // Optional fields, depending on action.
    betIdentifier: { type: String },
    externalTransactionId: { type: String },
    targetActionBetIdentifier: { type: String },
    targetActionType: { type: String },
  },
  { timestamps: true },
)

HacksawActionSchema.index({ updatedAt: 1 }, { expires: '3d' })
// Index to ensure idempotency of records, do not change/remove.
HacksawActionSchema.index({ transactionId: 1 }, { unique: true })

const HacksawActionModel = mongoose.model<HacksawAction>(
  'hacksaw_actions',
  HacksawActionSchema,
)

export const saveAction = async (
  payload: BaseHacksawAction,
): Promise<Require_id<HacksawAction>> => {
  const result = await HacksawActionModel.create(payload)

  return await result.toObject()
}

export const getAction = async (filter: Partial<HacksawActionDocument>) => {
  const result = await HacksawActionModel.findOne(filter).lean()

  return result
}

/**
 * In order for our action handling to be idempotent, it is
 * important to first attempt to create the document, and then
 * fallback to looking it up.
 */
export const touchAction = async (
  payload: BaseHacksawAction,
): Promise<TouchActionResult> => {
  try {
    const action = await saveAction(payload)

    return { action, existed: false }
  } catch (error) {
    if (error.code === MongoErrorCodes.DUPLICATE_KEY) {
      const existingDocument = await HacksawActionModel.findOneAndUpdate(
        {
          action: payload.action,
          transactionId: payload.transactionId,
        },
        { $inc: { attempts: 1 } },
        { new: true },
      ).lean()

      return { action: existingDocument ?? undefined, existed: true }
    }

    return { action: undefined, existed: false }
  }
}

export const updateAction = async (
  id: Types.ObjectId,
  payload: Partial<HacksawAction>,
): Promise<HacksawAction | null> => {
  const result = await HacksawActionModel.findOneAndUpdate(
    { _id: id },
    payload,
    { new: true },
  ).lean()
  return result
}

export const deleteAction = async (
  id: Types.ObjectId,
): Promise<HacksawAction | null> => {
  const result = await HacksawActionModel.findOneAndDelete({ _id: id }).lean()

  return result
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: HacksawActionModel.collection.name,
}
