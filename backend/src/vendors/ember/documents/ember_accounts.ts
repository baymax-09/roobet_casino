import { type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

export interface BaseEmberAccountLink {
  userId: string
  emberUserId: string
}

export interface EmberAccountLink extends BaseEmberAccountLink {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const EmberAccountSchema = new mongoose.Schema<EmberAccountLink>(
  {
    userId: { type: String, required: true },
    emberUserId: { type: String, required: true },
  },
  { timestamps: true },
)

EmberAccountSchema.index({ userId: 1, emberUserId: 1 }, { unique: true })

const EmberAccountModel = mongoose.model<EmberAccountLink>(
  'ember_account',
  EmberAccountSchema,
)

export const getEmberAccount = async (emberUserId: string) => {
  const account = await EmberAccountModel.findOne({ emberUserId }).lean()
  return account
}

export const deleteEmberAccountLink = async (
  userId: string,
  emberUserId: string,
) => {
  return await EmberAccountModel.deleteOne({ userId, emberUserId })
}

export const checkEmberAccountExists = async (
  emberUserId: string,
  userId: string,
) => {
  const existingAccount = await EmberAccountModel.exists({
    $or: [{ emberUserId }, { userId }],
  }).lean()
  return existingAccount
}

interface CreateAccountFailure {
  success: false
  detail: string
}
interface CreateAccountSuccess {
  success: true
  detail: EmberAccountLink
}
type CreateAccountResponse = CreateAccountFailure | CreateAccountSuccess

export const createEmberAccount = async (
  userId: string,
  emberUserId: string,
): Promise<CreateAccountResponse> => {
  const existingAccount = await checkEmberAccountExists(emberUserId, userId)
  if (existingAccount) {
    return { success: false, detail: 'Account already linked' }
  }
  const result = await EmberAccountModel.create({ userId, emberUserId })
  return { success: true, detail: result }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: EmberAccountModel.collection.name,
}
