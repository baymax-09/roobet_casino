import { MongoErrorCodes, mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { crmLogger } from '../lib/logger'

const ConsentTypes = [
  'email',
  'sms',
  'telephone',
  'postMail',
  'siteNotification',
  'pushNotification',
] as const
export type ConsentType = (typeof ConsentTypes)[number]
export const isConsentType = (value: any): value is ConsentType => {
  return ConsentTypes.includes(value)
}
export interface Consent extends Record<ConsentType, boolean> {
  userId: string
}

const ConsentSchema = new mongoose.Schema<Consent>(
  {
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    telephone: { type: Boolean, default: false },
    postMail: { type: Boolean, default: false },
    siteNotification: { type: Boolean, default: true },
    pushNotification: { type: Boolean, default: false },
    userId: { type: String, required: true, index: true, unique: true },
  },
  { timestamps: true },
)

const ConsentModel = mongoose.model<Consent>('consents', ConsentSchema)

export async function createConsent(userId: string) {
  const userConsents = {
    email: true,
    sms: false,
    telephone: false, // We don't care about this, but FT needs this field populated on their side
    postMail: false, // We don't care about this, but FT needs this field populated on their side
    siteNotification: true,
    pushNotification: false, // We don't care about this, but FT needs this field populated on their side
  }

  try {
    return (
      await ConsentModel.create({ userId, ...userConsents })
    ).toObject<Consent>()
  } catch (error) {
    if (error.code === MongoErrorCodes.DUPLICATE_KEY) {
      return await getConsentByUserId(userId)
    }
    crmLogger('createConsent', { userId }).error(
      `Failed to create document for user: ${userId}`,
      { userConsents },
      error,
    )
  }
}

export async function updateConsentForUserId(
  userId: string,
  update: Partial<Consent>,
): Promise<void> {
  try {
    await ConsentModel.findOneAndUpdate(
      { userId },
      { ...update },
      { upsert: true },
    )
  } catch (error) {
    crmLogger('updateConsentForUserId', { userId }).error(
      `Failed to update document for user: ${userId}`,
      { update },
      error,
    )
  }
}

export async function getConsentByUserId(userId: string) {
  return await ConsentModel.findOne({ userId }).lean<Consent>()
}

export async function getConsentsByConsentType(consentType: string) {
  return await ConsentModel.find({ [consentType]: true }).lean<Consent[]>()
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: ConsentModel.collection.name,
}
