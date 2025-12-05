import mongooseDelete, {
  type SoftDeleteInterface,
  type SoftDeleteModel,
} from 'mongoose-delete'
import { type Document, type UpdateQuery, type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { BasicCache } from 'src/util/redisModels'
import { subtractTimeInMs } from 'src/util/helpers/time'
import { type DBCollectionSchema } from 'src/modules'

import {
  schema as messageReadReceiptSchema,
  createBulkMessagesReadReceipt,
  createMessageReadReceipt,
} from './messageReadReceipt'
import {
  MESSAGING_CACHE_NAME,
  MESSAGING_CACHE_KEY_ALL,
  MESSAGING_TTL,
} from '../../constants'
import { getAllMessagesWithReadReceipts } from '../lib'

interface BaseMessage extends SoftDeleteInterface {
  /**
   * List of userIds.
   *
   * Empty list represents ALL users.
   *
   * NOTE: This will likely be more complex in the future.
   */
  recipients: string[] | null

  // Fields from templates.
  title: string
  body: string
  recipientCount?: number | null
  heroImage: string | null
  logoImage: string | null
  featuredImage: string | null
  link: string | null
  live: boolean
  liveAt: Date | null
  meta?: {
    scheduledEmitEventId: string
  }
}

export interface Message extends BaseMessage {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new mongoose.Schema<Message>(
  {
    recipients: { type: [String], required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    recipientCount: { type: Number, default: null },
    heroImage: { type: String, required: true, default: null },
    logoImage: { type: String, default: null },
    featuredImage: { type: String, default: null },
    link: { type: String, default: null },
    live: { type: Boolean, required: true, default: false },
    liveAt: { type: Date, default: null },
    meta: { type: Object, default: {} },
  },
  { timestamps: true },
)

MessageSchema.index({ recipients: 1 })

// For data warehousing.
MessageSchema.index({ updatedAt: 1 })

MessageSchema.plugin(mongooseDelete, {
  deletedBy: false,
  deletedAt: true,
  indexFields: 'all',
})

const MessageModel = mongoose.model<Message>(
  'messages',
  MessageSchema,
) as unknown as SoftDeleteModel<Message & Document>

export const getMessage = async (id: string): Promise<Message | null> => {
  return (await MessageModel.findById(id).lean()) ?? null
}

export const getMessages = async (
  conditions: Partial<Message>,
): Promise<Message[]> => {
  return await MessageModel.find(conditions)
    .sort([
      ['liveAt', -1],
      ['createdAt', -1],
    ])
    .lean()
}

export const createMessage = async (message: BaseMessage): Promise<Message> => {
  return await MessageModel.create(message)
}

export const updateMessage = async (
  id: string,
  updates: UpdateQuery<Message>,
): Promise<Message | null> => {
  return await MessageModel.findOneAndUpdate(
    { _id: id },
    { ...updates },
    { new: true },
  )
}

export const softDeleteMessage = async (
  id: string,
): Promise<Message | null> => {
  const _delete = await MessageModel.deleteById(id)

  if (_delete.deletedCount === 1) {
    return await MessageModel.findById(id).lean()
  }

  return null
}

export const getCachedMessagesForAllUsers = async (): Promise<Message[]> => {
  // 5 minutes.
  const cacheDuration = 60 * 5

  return await BasicCache.cached(
    MESSAGING_CACHE_NAME,
    MESSAGING_CACHE_KEY_ALL,
    cacheDuration,
    async () => {
      return await MessageModel.find({
        recipients: [],
        live: true,
        deleted: false,
        liveAt: {
          $lt: new Date(),
          $gt: subtractTimeInMs(MESSAGING_TTL, new Date()),
        },
      }).lean()
    },
  )
}

export const restoreMessage = async (id: string): Promise<Message | null> => {
  const restore = await MessageModel.restore({ _id: id })

  if (restore.matchedCount === 1) {
    return await MessageModel.findById(id).lean()
  }

  return null
}

export const getMessagesForUserId = async (
  userId: string,
  lean = false,
): Promise<Message[]> => {
  if (lean) {
    return await MessageModel.find({
      recipients: userId,
      live: true,
      liveAt: {
        $lt: new Date(),
        $gt: subtractTimeInMs(MESSAGING_TTL, new Date()),
      },
    }).lean()
  }

  return await MessageModel.aggregate([
    {
      $match: {
        recipients: userId,
        live: true,
        liveAt: {
          $lt: new Date(),
          $gt: subtractTimeInMs(MESSAGING_TTL, new Date()),
        },
      },
    },
    {
      $lookup: {
        from: messageReadReceiptSchema.name,
        as: 'readReceipt',
        let: { id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$messageId', '$$id'] },
                  { $eq: ['$userId', userId] },
                ],
              },
            },
          },
        ],
      },
    },
  ])
}

export const markMessagesAsRead = async (
  userId: string,
  messageIds?: Types.ObjectId[] | null,
) => {
  // Mark all messages as read if no specific message id supplied
  if (!messageIds) {
    const documentsToInsert = (await getAllMessagesWithReadReceipts(userId))
      .filter(mappedMessage => !mappedMessage.readReceipt)
      .map(message => ({ userId, messageId: message._id }))

    return await createBulkMessagesReadReceipt(documentsToInsert)
  }
  const createMessages = messageIds?.map(async messageId => {
    return await createMessageReadReceipt(messageId, userId)
  })
  return await Promise.all(createMessages)
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: MessageModel.collection.name,
}
