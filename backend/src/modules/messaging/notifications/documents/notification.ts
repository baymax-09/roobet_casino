import { io, mongoose } from 'src/system'
import { MESSAGING_TTL } from 'src/modules/messaging'
import { type DBCollectionSchema } from 'src/modules'

import { type NotificationType } from '../types'

interface BaseNotification {
  userId: string
  message: string
  read: boolean
  type: NotificationType
  meta: Record<string, any>
}

export interface Notification extends BaseNotification {
  _id: string
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new mongoose.Schema<Notification>(
  {
    userId: {
      type: String,
      index: true,
    },
    message: String,
    read: Boolean,
    type: String,
    meta: {},
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      expires: MESSAGING_TTL / 1000,
    },
  },
  { timestamps: true },
)

NotificationSchema.index({ userId: 1, read: 1 })

const NotificationModel = mongoose.model<Notification>(
  'notifications',
  NotificationSchema,
)

export async function createNotification(
  userId: string,
  message: string,
  type: NotificationType = 'misc',
  meta: object = {},
): Promise<void> {
  const toInsert = {
    message,
    userId,
    type,
    read: false,
    meta,
  }
  const result = await NotificationModel.create(toInsert)
  io.to(userId).emit('newNotification', result)
}

export async function markAllNotificationsRead(userId: string) {
  await NotificationModel.updateMany(
    { userId, read: false },
    { read: true },
  ).exec()
}

export async function markRead(_id: string) {
  await NotificationModel.updateOne({ _id }, { read: true }).exec()
}

export async function getNotificationsForUserId(
  userId: string,
): Promise<Notification[]> {
  return await NotificationModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: NotificationModel.collection.name,
}
