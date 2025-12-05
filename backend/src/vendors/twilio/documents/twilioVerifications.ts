import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'

interface TwilioVerification {
  userId: string
  phoneNumber: string
  createdAt?: Date
  updateAt?: Date
}

const TwilioVerificationSchema = new mongoose.Schema<TwilioVerification>(
  {
    userId: { type: String, index: true, unique: true },
    phoneNumber: { type: String },
    createdAt: { type: Date, expires: '10m' },
  },
  { timestamps: true },
)

const TwilioVerificationModel = mongoose.model<TwilioVerification>(
  'twilio_verifications',
  TwilioVerificationSchema,
)

export const setVerificationPhoneNumber = async (
  userId: string,
  phoneNumber: string,
) => await TwilioVerificationModel.create([{ userId, phoneNumber }])

export const getActivePhoneNumberVerification = async (userId: string) =>
  await TwilioVerificationModel.findOne({ userId }).lean()

export const deleteVerificationPhoneNumber = async (userId: string) =>
  await TwilioVerificationModel.deleteOne({ userId })

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: TwilioVerificationModel.collection.name,
}
