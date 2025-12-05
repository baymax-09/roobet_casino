import { type Types } from 'mongoose'
import { type DBCollectionSchema } from 'src/modules'
import { getActiveBets } from 'src/modules/bet/documents/activeBetsMongo'
import { MongoErrorCodes, mongoose } from 'src/system'

export const SlotegratorActionTypes = [
  'balance',
  'bet',
  'close',
  'refund',
  'rollback',
  'settle',
  'win',
] as const

export type SlotegratorActionTypesUnion =
  (typeof SlotegratorActionTypes)[number]

export interface BaseSlotegratorAction {
  action: SlotegratorActionTypesUnion
  betslipId: string
  userId: string
  transactionId?: string
  externalTransactionId?: string
  gameIdentifier?: string
  actionType?: string
  amount?: number
}

export interface SlotegratorAction extends BaseSlotegratorAction {
  _id: Types.ObjectId
  attempts: number
  createdAt: Date
  updatedAt: Date
}

const SlotegratorActionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    betslipId: { type: String, required: true },
    action: { type: String, enum: SlotegratorActionTypes, required: true },
    attempts: { type: Number, default: 1, required: true },

    // Optional fields, depending on action.
    transactionId: { type: String },
    externalTransactionId: { type: String },
    gameIdentifier: { type: String },
    actionType: { type: String },
    amount: { type: Number },
  },
  { timestamps: true },
)

// 90d unlike other providers because this is sportsbook.
SlotegratorActionSchema.index({ updatedAt: 1 }, { expires: '90d' })

// Index to ensure idempotency of records, do not change/remove.
// This assumes a rollback cannot happen more than once, is that correct?
SlotegratorActionSchema.index({ betslipId: 1, action: 1 }, { unique: true })

const SlotegratorActionModel = mongoose.model<SlotegratorAction>(
  'slotegrator_actions',
  SlotegratorActionSchema,
)

export const saveAction = async (
  payload: BaseSlotegratorAction,
): Promise<SlotegratorAction> => {
  const result = await SlotegratorActionModel.create(payload)

  return await result.toObject()
}

export const getAction = async (
  filter: Partial<SlotegratorAction>,
): Promise<SlotegratorAction | null> => {
  const result = await SlotegratorActionModel.findOne(filter).lean()

  return result
}

/**
 * In order for our action handling to be idempotent, it is
 * important to first attempt to create the document, and then
 * fallback to looking it up.
 */
export const touchAction = async (
  payload: BaseSlotegratorAction,
): Promise<{ action: SlotegratorAction | undefined; existed: boolean }> => {
  try {
    const action = await saveAction(payload)

    return { action, existed: false }
  } catch (error) {
    if (error.code === MongoErrorCodes.DUPLICATE_KEY) {
      const existingDocument = await SlotegratorActionModel.findOneAndUpdate(
        {
          action: payload.action,
          betslipId: payload.betslipId,
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
  payload: Partial<BaseSlotegratorAction>,
): Promise<SlotegratorAction | null> => {
  const result = await SlotegratorActionModel.findOneAndUpdate(
    { _id: id },
    payload,
  ).lean()

  return result
}

export const deleteAction = async (
  id: Types.ObjectId,
): Promise<SlotegratorAction | null> => {
  const result = await SlotegratorActionModel.findOneAndDelete({
    _id: id,
  }).lean()

  return result
}

export async function unfinishedSlotegratorRounds({
  userId,
  sinceTimestamp,
}: {
  userId: string
  sinceTimestamp: string
}) {
  const unfinishedSlotegratorRounds = await getActiveBets({
    userId,
    closedOut: { $exists: false },
    gameIdentifier: { $regex: /slotegrator:sportsbook-1/i },
    createdAt: {
      $gte: sinceTimestamp,
    },
  })

  return unfinishedSlotegratorRounds
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: SlotegratorActionModel.collection.name,
}
