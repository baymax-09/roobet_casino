import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'

export enum CMSContentFormats {
  TEXT = 'text',
  MARKDOWN = 'markdown',
}

export interface CMSContentDocument {
  lang: string
  name: string
  title: string
  content: string
  format: CMSContentFormats
  content_html?: string
  createdAt?: Date
  updatedAt?: Date
}

const CMSContentSchema = new mongoose.Schema(
  {
    lang: { type: String },
    name: { type: String },
    title: { type: String },
    content: { type: String },
    content_html: { type: String },
    format: {
      type: String,
      enum: CMSContentFormats,
      default: CMSContentFormats.TEXT,
    },
  },
  { timestamps: true, collection: 'cms_content' },
)

const CMSContentModel = mongoose.model<CMSContentDocument>(
  'cms_content',
  CMSContentSchema,
)

export const getCmsDocument = async (
  name: string,
  lang: string,
): Promise<CMSContentDocument | undefined> => {
  return await (
    await CMSContentModel.findOne({
      name,
      ...(lang ? { lang } : { $or: [{ lang: 'en' }] }),
    })
  )?.toObject()
}

export const upsertCmsDocument = async (
  doc: Partial<CMSContentDocument> & Pick<CMSContentDocument, 'name' | 'lang'>,
): Promise<CMSContentDocument | undefined> => {
  const { name, lang } = doc
  const id = { name, lang }

  await CMSContentModel.updateOne(id, doc, { upsert: true })

  return await getCmsDocument(name, lang)
}

export const deleteCmsDocument = async (
  name: string,
  lang: string,
): Promise<void> => {
  const doc = await CMSContentModel.findOne({ name, lang })

  await doc?.deleteOne()
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: 'cms_content',
}
