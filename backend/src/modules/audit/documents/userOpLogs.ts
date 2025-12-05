import { type FilterQuery } from 'mongoose'

import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { Categories, type Category } from '../type'

export interface UserOpLog {
  userId: string
  resource: string
  operation: string
  category: Category
}

interface DBUserOpLog extends UserOpLog {
  updatedAt: Date
  createdAt: Date
}

const UserOpLogSchema = new megaloMongo.Schema<DBUserOpLog>(
  {
    userId: { type: String, required: true },
    resource: { type: String, required: true },
    operation: { type: String, required: true },
    category: { type: String, enum: Categories, required: true },
  },
  { timestamps: true },
)

UserOpLogSchema.index({ userId: 1 })
UserOpLogSchema.index({ resource: 1 })
UserOpLogSchema.index({ operation: 1 })

export const UserOpLogModel = megaloMongo.model<DBUserOpLog>(
  'user_op_log',
  UserOpLogSchema,
  'user_op_log',
)

export const createUserOpLog = async (
  payload: UserOpLog,
): Promise<DBUserOpLog> => {
  return await (await UserOpLogModel.create(payload)).toObject()
}

export const getUserOpLog = async (
  filter: FilterQuery<UserOpLog>,
): Promise<DBUserOpLog | null> => {
  return await UserOpLogModel.findOne(filter).lean()
}

export const getMostRecentOpLog = async (
  filter: FilterQuery<UserOpLog>,
): Promise<DBUserOpLog | null> => {
  return await UserOpLogModel.findOne(filter)
    .sort({ createdAt: -1 })
    .limit(1)
    .lean()
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: UserOpLogModel.collection.name,
}
