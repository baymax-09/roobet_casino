import { type Types } from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { MongoErrorCodes, mongoose } from 'src/system'

export const CoinFlipActionTypes = [
  'open',
  'join',
  'refund',
  'resolve',
] as const

export type CoinFlipActionTypesUnion = (typeof CoinFlipActionTypes)[number]

export interface CoinFlipAction {
  _id: Types.ObjectId
  action: CoinFlipActionTypesUnion
  gameId: string
}

const CoinFlipIdempotencySchema = new mongoose.Schema(
  {
    gameId: { type: String, required: true },
    action: { type: String, enum: CoinFlipActionTypes, required: true },
  },
  { timestamps: true },
)

CoinFlipIdempotencySchema.index({ createdAt: 1 }, { expires: '90d' })

// Index to ensure idempotency of records, do not change/remove.
CoinFlipIdempotencySchema.index({ gameId: 1, action: 1 }, { unique: true })

const CoinFlipIdempotencyModel = mongoose.model<CoinFlipAction>(
  'coinflip_actions',
  CoinFlipIdempotencySchema,
)

const saveAction = async (
  payload: Omit<CoinFlipAction, '_id'>,
): Promise<CoinFlipAction> => {
  const result = await CoinFlipIdempotencyModel.create(payload)

  return await result.toObject()
}

export const getAction = async (
  filter: Partial<CoinFlipAction>,
): Promise<CoinFlipAction | null> => {
  const result = await CoinFlipIdempotencyModel.findOne(filter).lean()

  return result
}

/**
 * In order for our action handling to be idempotent, it is
 * important to first attempt to create the document, and then
 * fallback to looking it up.
 *
 */
export const getOrCreateAction = async (
  payload: Omit<CoinFlipAction, '_id'>,
): Promise<{ action: CoinFlipAction | undefined; existed?: boolean }> => {
  try {
    const action = await saveAction(payload)

    return { action, existed: false }
  } catch (error) {
    if (error.code === MongoErrorCodes.DUPLICATE_KEY) {
      const existingDocument = await getAction({
        action: payload.action,
        gameId: payload.gameId,
      })

      return { action: existingDocument ?? undefined, existed: true }
    }

    return { action: undefined }
  }
}

export const deleteAction = async (
  id: Types.ObjectId,
): Promise<CoinFlipAction | null> => {
  return await CoinFlipIdempotencyModel.findOneAndDelete({ _id: id }).lean()
}

export const deleteActionByGameId = async (
  payload: Omit<CoinFlipAction, '_id'>,
) => {
  return await CoinFlipIdempotencyModel.findOneAndDelete({
    gameId: payload.gameId,
    action: payload.action,
  }).lean()
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: CoinFlipIdempotencyModel.collection.name,
}
