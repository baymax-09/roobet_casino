import { type Types, type FilterQuery } from 'mongoose'
import { type DBCollectionSchema } from 'src/modules'
import { MongoErrorCodes, mongoose } from 'src/system'

export const SlotegratorSlotsActionTypes = [
  'balance',
  'bet',
  'win',
  'refund',
  'rollback',
] as const

export type SlotegratorSlotsActionTypesUnion =
  (typeof SlotegratorSlotsActionTypes)[number]

export interface BaseSlotegratorSlotsAction {
  gameId: string
  action: SlotegratorSlotsActionTypesUnion
  userId: string
  roundId: string
  sessionId: string
  amount: number
  externalTransactionId: string

  // Optional fields.
  externalBetTransactionId?: string
  transactionId?: string
}

export interface SlotegratorSlotsAction extends BaseSlotegratorSlotsAction {
  _id: Types.ObjectId
  updatedAt: Date
  createdAt: Date
  attempts: number
}

const SlotegratorSlotsActionSchema = new mongoose.Schema(
  {
    gameId: { type: String, required: true },
    userId: { type: String, required: true },
    action: { type: String, enum: SlotegratorSlotsActionTypes, required: true },
    roundId: { type: String, required: true },
    sessionId: { type: String, required: true },
    attempts: { type: Number, default: 1, required: true },
    amount: { type: Number, default: 0, required: true },

    // Unique to ensure idempotency of records, do not change/remove.
    externalTransactionId: { type: String, required: true, unique: true },

    // Optionals, depending on action.
    externalBetTransactionId: { type: String },
    transactionId: { type: String },
  },
  { timestamps: true },
)

SlotegratorSlotsActionSchema.index({ updatedAt: 1 }, { expires: '3d' })

// Used to aggregate payout amount.
SlotegratorSlotsActionSchema.index({ roundId: 1, action: 1 })

// Used to query action records.
SlotegratorSlotsActionSchema.index({ externalTransactionId: 1 })

const SlotegratorSlotsActionModel = mongoose.model<SlotegratorSlotsAction>(
  'slotegrator_slots_actions',
  SlotegratorSlotsActionSchema,
)

export const saveAction = async (
  payload: BaseSlotegratorSlotsAction,
): Promise<SlotegratorSlotsAction> => {
  const result = await SlotegratorSlotsActionModel.create(payload)

  return await result.toObject()
}

export const getAction = async (
  filter: FilterQuery<SlotegratorSlotsAction>,
): Promise<SlotegratorSlotsAction | null> => {
  const result = await SlotegratorSlotsActionModel.findOne(filter).lean()

  return result
}

export const sumTotalPayoutAmount = async (
  roundId: string,
): Promise<number> => {
  const result = await SlotegratorSlotsActionModel.aggregate([
    {
      $match: {
        roundId,
        action: 'win',
      },
    },
    {
      $group: {
        _id: null,
        amount: {
          $sum: '$amount',
        },
      },
    },
  ])

  return result[0]?.amount ?? 0
}

/**
 * In order for our action handling to be idempotent, it is
 * important to first attempt to create the document, and then
 * fallback to looking it up.
 */
export const touchAction = async (
  payload: BaseSlotegratorSlotsAction,
): Promise<{
  action: SlotegratorSlotsAction | undefined
  existed?: boolean
}> => {
  try {
    const action = await saveAction(payload)

    return { action, existed: false }
  } catch (error) {
    if (error.code === MongoErrorCodes.DUPLICATE_KEY) {
      const existingDocument =
        await SlotegratorSlotsActionModel.findOneAndUpdate(
          {
            externalTransactionId: payload.externalTransactionId,
          },
          { $inc: { attempts: 1 } },
          { new: true },
        ).lean()

      return { action: existingDocument ?? undefined, existed: true }
    }

    return { action: undefined }
  }
}

export const updateAction = async (
  id: Types.ObjectId,
  payload: Partial<BaseSlotegratorSlotsAction>,
): Promise<SlotegratorSlotsAction | null> => {
  const result = await SlotegratorSlotsActionModel.findOneAndUpdate(
    { _id: id },
    payload,
  ).lean()

  return result
}

export const deleteAction = async (
  id: Types.ObjectId,
): Promise<SlotegratorSlotsAction | null> => {
  const result = await SlotegratorSlotsActionModel.findOneAndDelete({
    _id: id,
  }).lean()

  return result
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: SlotegratorSlotsActionModel.collection.name,
}
