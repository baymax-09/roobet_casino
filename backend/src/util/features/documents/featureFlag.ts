import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'
import { BasicCache } from 'src/util/redisModels'

import { type FeatureFlag, type FeatureName } from '../types'

const FeatureFlagSchema = new mongoose.Schema<FeatureFlag>(
  {
    name: {
      type: String,
      index: true,
      unique: true,
    },
    state: String,
    disabled: Boolean,
    regionList: { type: [String] },
    betaTesters: { type: [String] },
  },
  { timestamps: true },
)

const FeatureFlagsModel = mongoose.model<FeatureFlag>(
  'feature_flags',
  FeatureFlagSchema,
)

/** We should only be reading from this collection -- NO WRITES */

export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  return await BasicCache.cached(
    'featureFlags',
    '',
    10,
    async () => await FeatureFlagsModel.find({}).exec(),
  )
}

export async function getFeatureFlag(
  name: FeatureName,
): Promise<FeatureFlag | null> {
  return await FeatureFlagsModel.findOne({ name }).exec()
}

/** This should be use for LOCAL development only. */
export const __unsafeCreateFeatureFlag = async (
  payload: FeatureFlag,
): Promise<FeatureFlag> => {
  return await (await FeatureFlagsModel.create(payload)).toObject()
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: FeatureFlagsModel.collection.name,
}
