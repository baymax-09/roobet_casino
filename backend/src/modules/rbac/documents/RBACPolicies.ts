import { type UpdatePayload, type Types } from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'
import { BasicCache } from 'src/util/redisModels'

import { type PolicyEffect, PolicyEffects, type RBACRule } from '../types'
import { resourcesRegexQueryCondition } from '../utils'

export interface BaseRBACPolicy {
  effect: PolicyEffect
  name: string
  slug: string
  rules: RBACRule[]
}

export interface RBACPolicy extends BaseRBACPolicy {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

interface GetPoliciesArgs {
  ids?: Types.ObjectId[] | null
  names?: string[] | null
  resources?: string[] | null
}

const rbacPolicyCacheName = 'rbacPolicy'
const rbacPolicyExp = 60 * 60

const RBACPolicySchema = new mongoose.Schema<RBACPolicy>(
  {
    effect: {
      type: String,
      default: 'allow',
      enum: PolicyEffects,
      required: true,
    },
    name: { type: String, index: true, required: true },
    slug: { type: String, index: true, unique: true, required: true },
    rules: { type: [String], required: true },
  },
  { timestamps: true },
)

export const RBACPolicyModel = mongoose.model<RBACPolicy>(
  'rbac_policies',
  RBACPolicySchema,
)

export const createPolicy = async (
  payload: BaseRBACPolicy,
): Promise<RBACPolicy> => {
  const result = (await RBACPolicyModel.create(payload)).toObject()
  await BasicCache.set(
    rbacPolicyCacheName,
    result._id.toString(),
    result,
    rbacPolicyExp,
  )
  return result
}

export const getPolicy = async (id: string): Promise<RBACPolicy | null> => {
  return BasicCache.cached(
    rbacPolicyCacheName,
    id,
    rbacPolicyExp,
    async () => await RBACPolicyModel.findById(id).lean<RBACPolicy | null>(),
  )
}

export const getPolicies = async ({
  ids,
  names,
  resources,
}: GetPoliciesArgs): Promise<RBACPolicy[]> => {
  const filter = {
    ...(ids && { _id: { $in: ids } }),
    ...(names && { name: { $in: names } }),
    ...(resources && { slug: resourcesRegexQueryCondition(resources) }),
  }
  return await RBACPolicyModel.find(filter).lean<RBACPolicy[]>()
}

export const updatePolicy = async (
  id: string,
  updatePayload: UpdatePayload<BaseRBACPolicy>,
): Promise<RBACPolicy | null> => {
  const result = await RBACPolicyModel.findOneAndUpdate(
    { _id: id },
    updatePayload,
    {
      new: true,
    },
  ).lean()
  await BasicCache.set(rbacPolicyCacheName, id, result, rbacPolicyExp)
  return result
}

export const deletePolicies = async (ids: string[]): Promise<void> => {
  // Delete, then invalidate so another process doesn't hydrate the cache as we delete from Mongo.
  await RBACPolicyModel.deleteMany({ _id: { $in: ids } })
  await Promise.allSettled([
    ...ids.map(id => BasicCache.invalidate(rbacPolicyCacheName, id)),
  ])
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: RBACPolicyModel.collection.name,
}
