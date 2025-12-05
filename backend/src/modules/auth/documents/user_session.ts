import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'
import { type RoobetSessionData } from 'src/util/middleware'

export interface UserSession {
  _id: string
  id: string
  sessionId: string
  lastIp: string
  userId: string
  destroyed: boolean
  device: string
  country: string
  createdAt: Date
  updatedAt: Date
}

const UserSessionsSchema = new mongoose.Schema<UserSession>(
  {
    sessionId: { type: String, index: true },
    lastIp: String,
    userId: { type: String, index: true },
    destroyed: { type: Boolean, default: false },
    device: String,
    country: String,
  },
  { timestamps: true },
)

const UserSessionModel = mongoose.model<UserSession>(
  'user_sessions',
  UserSessionsSchema,
)

export async function touchUserSession(
  sessionId: string,
  userId: string,
  session: RoobetSessionData,
) {
  return await UserSessionModel.findOneAndUpdate(
    {
      sessionId,
    },
    {
      sessionId,
      userId,
      // non-null assertion because if you have a Passport session to touch you have a fingerprint
      device: session.fingerprint!.device,
      lastIp: session.fingerprint!.ip,
      country: session.fingerprint!.country,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  ).exec()
}

export async function removeUserSessionBySid(sessionId: string) {
  return await UserSessionModel.findOneAndUpdate(
    {
      sessionId,
    },
    {
      destroyed: true,
    },
  ).exec()
}

export const getUserSessionBySid = async (sessionId: string) => {
  return await UserSessionModel.findOne({ sessionId })
}

export function getUserSessionsByUser(userId: string) {
  return UserSessionModel.find().where('userId', userId)
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: UserSessionModel.collection.name,
}
