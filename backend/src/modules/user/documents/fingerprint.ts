import _ from 'underscore'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { userLogger } from '../lib/logger'

export interface Fingerprint {
  _id: string
  userId: string
  visitorId: string
  meta: object
  createdAt?: string
  updatedAt?: string
}

/*
 * to test locally use ngrok
 *  ngrok http --region=us --hostname=fingerprint.ngrok.io 3003
 */

const FingerprintSchema = new mongoose.Schema<Fingerprint>(
  {
    userId: { type: String, index: true },
    visitorId: { type: String, index: true },
    meta: { type: Object },
  },
  { timestamps: true },
)

FingerprintSchema.index({ userId: 1, visitorId: 1 }, { unique: true })

const FingerprintModel = mongoose.model<Fingerprint>(
  'fingerprints',
  FingerprintSchema,
)

export async function recordFingerprint(
  userId: string,
  visitorId: string,
  meta: object,
): Promise<void> {
  try {
    await FingerprintModel.findOneAndUpdate(
      {
        visitorId,
        userId,
      },
      { meta },
      { upsert: true },
    )
  } catch (error) {
    userLogger('recordFingerprint', { userId }).error(
      `Failed to record fingerprint for user: ${userId}`,
      { visitorId, meta },
      error,
    )
  }
}

export async function getFingerprintsByUserId(userId: string) {
  return await FingerprintModel.find({ userId })
}

export async function getUsersWithSameFingerprint(userId: string) {
  const fingerprints = await getFingerprintsByUserId(userId)
  const visitorIds = _.pluck(fingerprints, 'visitorId')
  const matches = await FingerprintModel.find({
    visitorId: { $in: visitorIds },
  })
  const userIds = _.pluck(matches, 'userId')
  return _.uniq(userIds)
}

/*
 * ACP route needs:
 * 1. get all fingerprints by userid
 * 2. create a list of visitorId's
 * 3. get all userId's who have touched that visitorId
 * 4. dedupe + return users from the userIds
 */

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: FingerprintModel.collection.name,
}
