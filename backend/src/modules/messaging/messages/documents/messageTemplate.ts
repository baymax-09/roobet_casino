import mongooseDelete, {
  type SoftDeleteInterface,
  type SoftDeleteModel,
} from 'mongoose-delete'
import { type Document, type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

export interface MessageTemplateDocument extends SoftDeleteInterface {
  _id: Types.ObjectId
  name: string
  title: string
  body: string
  heroImage: string | null
  createdAt?: Date
  updatedAt?: Date
}

const MessageTemplateSchema = new mongoose.Schema<MessageTemplateDocument>(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    heroImage: { type: String, required: true, default: null },
  },
  { timestamps: true },
)

MessageTemplateSchema.plugin(mongooseDelete, {
  deletedBy: false,
  deletedAt: true,
  indexFields: 'all',
})

const MessageTemplate = mongoose.model<MessageTemplateDocument>(
  'message_templates',
  MessageTemplateSchema,
) as unknown as SoftDeleteModel<MessageTemplateDocument & Document>

export const getMessageTemplate = async (
  id: string,
): Promise<MessageTemplateDocument | null> => {
  return (await MessageTemplate.findById(id).lean()) || null
}

export const getMessageTemplates = async (
  conditions: Partial<MessageTemplateDocument>,
): Promise<MessageTemplateDocument[]> => {
  return await MessageTemplate.find(conditions).sort({ createdAt: -1 }).lean()
}

export const createMessageTemplate = async (
  message: Omit<MessageTemplateDocument, '_id'>,
): Promise<MessageTemplateDocument> => {
  return await MessageTemplate.create(message)
}

export const updateMessageTemplate = async (
  id: string,
  updates: Partial<Omit<MessageTemplateDocument, 'id'>>,
): Promise<MessageTemplateDocument | null> => {
  return await MessageTemplate.findOneAndUpdate(
    { _id: id },
    {
      ...updates,
    },
    { new: true },
  )
}

export const softDeleteMessageTemplate = async (
  id: string,
): Promise<MessageTemplateDocument | null> => {
  const _delete = await MessageTemplate.deleteById(id)

  if (_delete.deletedCount === 1) {
    return await MessageTemplate.findById(id).lean()
  }

  return null
}

export const restoreMessageTemplate = async (
  id: string,
): Promise<MessageTemplateDocument | null> => {
  const restore = await MessageTemplate.restore({ _id: id })

  if (restore.matchedCount === 1) {
    return await MessageTemplate.findById(id).lean()
  }

  return null
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: MessageTemplate.collection.name,
}
