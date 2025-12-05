import { type Types } from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'

export interface MessageReadReceiptDocument {
  _id: Types.ObjectId
  userId: string
  messageId: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const MessageReadReceiptSchema =
  new mongoose.Schema<MessageReadReceiptDocument>(
    {
      userId: { type: String, required: true },
      messageId: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
    { timestamps: true },
  )

MessageReadReceiptSchema.index({ messageId: 1 })
MessageReadReceiptSchema.index({ userId: 1, messageId: 1 }, { unique: true })

const MessageReadReceipt = mongoose.model<MessageReadReceiptDocument>(
  'message_read_receipts',
  MessageReadReceiptSchema,
)

type CreateBulkMessagesReadReceiptArgs = Array<{
  userId: string
  messageId: Types.ObjectId
}>

export const createMessageReadReceipt = async (
  messageId: Types.ObjectId,
  userId: string,
): Promise<MessageReadReceiptDocument> => {
  return await MessageReadReceipt.create({
    messageId,
    userId,
  })
}

export const createBulkMessagesReadReceipt = async (
  insertPayload: CreateBulkMessagesReadReceiptArgs,
) => {
  return await MessageReadReceipt.insertMany(insertPayload)
}

export const getReadReceiptsForMessages = async (
  userId: string,
  messageIds: Types.ObjectId[],
): Promise<MessageReadReceiptDocument[]> => {
  return await MessageReadReceipt.find({
    userId,
    messageId: { $in: messageIds },
  })
}

export const getReadReceiptCountForMessage = async (
  messageId: Types.ObjectId,
): Promise<number> => {
  return await MessageReadReceipt.countDocuments({ messageId })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: MessageReadReceipt.collection.name,
}
