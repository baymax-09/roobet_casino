import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { mongoChangeFeedHandler } from 'src/util/mongo'
import { publishUserUpdateMessageToFastTrack } from 'src/vendors/fasttrack'
import { crmLogger } from '../lib/logger'

export interface CRM {
  _id: string
  userId: string
  marketing_influencer?: boolean
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  /** Cellxpert */
  cxd?: string | null
  cxAffId?: string | null
  selfCxAffId?: string | null
}

const CRMSchema = new mongoose.Schema<CRM>(
  {
    userId: { type: String, index: true },
    marketing_influencer: { type: Boolean, index: true },
    utm_source: { type: String },
    utm_medium: { type: String },
    utm_campaign: { type: String },
    cxd: { type: String },
    cxAffId: { type: String },
    selfCxAffId: { type: String },
  },
  { timestamps: true },
)

const CRMModel = mongoose.model<CRM>('crms', CRMSchema)

export async function updateCRMForUserId(
  userId: string,
  update: Partial<CRM>,
): Promise<CRM | null> {
  try {
    return await CRMModel.findOneAndUpdate(
      {
        userId,
      },
      { ...update },
      { upsert: true, new: true },
    )
  } catch (error) {
    crmLogger('updateCRMForUserId', { userId }).error(
      `Failed to update document for user: ${userId}`,
      { update },
      error,
    )
  }

  return null
}

const makeConditionalPipeline = (update: Partial<CRM>) =>
  Object.fromEntries(
    Object.entries(update).map(([key, value]) => [
      key,
      { $ifNull: [`$${key}`, value] },
    ]),
  )

export const updateCRMIfNotExist = async (
  userId: string,
  update: Partial<CRM>,
) => {
  await CRMModel.findOneAndUpdate(
    { userId },
    [{ $set: makeConditionalPipeline(update) }],
    { upsert: true },
  )
}

export async function getCRMByInfluencer(
  limit = 25,
  page = 0,
): Promise<{ page: number; limit: number; count: number; data: CRM[] }> {
  const query = () => CRMModel.find({ marketing_influencer: true })

  return {
    page,
    limit,
    count: await query().countDocuments(),
    data: await query()
      .limit(limit)
      .skip(page * limit),
  }
}

export async function getCRMByUserId(userId: string) {
  return await CRMModel.findOne({ userId }).lean()
}

/* FEEDS */
const crmsChangeFeed = async () => {
  try {
    await mongoChangeFeedHandler<CRM>(CRMModel, async document => {
      const updatedFields =
        document.operationType === 'update'
          ? document.updateDescription?.updatedFields
          : null

      const fullDocument = document.fullDocument
      const isAffiliateUpdate =
        updatedFields &&
        Object.keys(updatedFields).some(field =>
          ['marketing_influencer', 'cxAffId'].includes(field),
        )
      if (
        fullDocument &&
        (isAffiliateUpdate || document.operationType === 'insert')
      ) {
        publishUserUpdateMessageToFastTrack(fullDocument.userId)
      }
    })
  } catch (error) {
    crmLogger('crmsChangeFeed', { userId: null }).error(
      'There was an error in the bet history change feed',
      error,
    )
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: CRMModel.collection.name,
  feeds: [crmsChangeFeed],
}
