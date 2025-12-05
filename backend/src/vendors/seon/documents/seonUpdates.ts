import { megaloMongo } from 'src/system'
import { scopedLogger } from 'src/system/logger'
import { type DBCollectionSchema } from 'src/modules'

import { type WebhookPayload, type WebhookEvent } from 'src/vendors/seon/types'

type SeonUpdateDocument = WebhookPayload<WebhookEvent>

// We are not keeping a strict schema for this collection.
const SeonUpdateSchema = new megaloMongo.Schema<SeonUpdateDocument>(
  {},
  { timestamps: true, strict: false },
)

// Since this data is not read by the application, expire docs after a week.
SeonUpdateSchema.index({ createdAt: 1 }, { expires: '7d' })

const SeonUpdateModel = megaloMongo.model<SeonUpdateDocument>(
  'seon_updates',
  SeonUpdateSchema,
)

const seonLogger = scopedLogger('seon')

export const recordSeonUpdate = async <T extends WebhookEvent>(
  document: WebhookPayload<T>,
): Promise<void> => {
  try {
    await SeonUpdateModel.create(document)
  } catch (error) {
    seonLogger('recordSeonUpdate', { userId: null }).error(
      'failed to write to seon history collection',
      error,
    )
  }
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: SeonUpdateModel.collection.name,
}
