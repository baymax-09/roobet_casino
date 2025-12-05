import { type UpdatePayload, type Types } from 'mongoose'

import { type DBCollectionSchema } from 'src/modules'
import { getAllUserIdsByUserNamesLowerCase } from 'src/modules/user'
import { mongoose } from 'src/system'
import { exists } from 'src/util/helpers/types'

import {
  type RBACPolicy,
  schema as policySchema,
  getPolicy,
} from './RBACPolicies'
import { BasicCache } from 'src/util/redisModels'

export interface BaseRBACRole {
  name: string
  slug: string
  userIds: string[]
  policyIds: Types.ObjectId[]
}

export interface RBACRole extends BaseRBACRole {
  _id: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

export interface JoinedRBACRole extends RBACRole {
  policies: RBACPolicy[]
}

type GetRolesArgs<T extends boolean> = Partial<{
  ids: Types.ObjectId[] | null
  slugs: string[] | null
  policyIds: Types.ObjectId[] | null
  usernames: string[] | null
  userIds: string[] | null
  joinPolicies: T
}>

const rbacRolesCacheName = 'rbacRole'
const rbacRolesExp = 60 * 60

const RBACRoleSchema = new mongoose.Schema<RBACRole>(
  {
    name: { type: String, index: true, required: true },
    slug: { type: String, unique: true, required: true },
    userIds: { type: [String] },
    policyIds: { type: [mongoose.Schema.Types.ObjectId], required: true },
  },
  { timestamps: true },
)

export const RBACRoleModel = mongoose.model<RBACRole>(
  'rbac_roles',
  RBACRoleSchema,
)

export const getRole = async (id: string): Promise<RBACRole | null> => {
  return await RBACRoleModel.findById(id).lean<RBACRole | null>()
}

export const getRoleBySlug = async (slug: string): Promise<RBACRole | null> => {
  return await BasicCache.cached(
    rbacRolesCacheName,
    slug,
    rbacRolesExp,
    async () => await RBACRoleModel.findOne({ slug }).lean<RBACRole | null>(),
  )
}

export const createRole = async (payload: BaseRBACRole): Promise<RBACRole> => {
  const result = (await RBACRoleModel.create(payload)).toObject()
  await BasicCache.set(rbacRolesCacheName, result.slug, result, rbacRolesExp)
  return result
}

export const getJoinedRBACRolesBySlugs = async (
  slugs: string[],
): Promise<JoinedRBACRole[]> => {
  // To prevent unnecessary time over the wire, grab each unique policy once.
  const policies = new Map<string, RBACPolicy>()

  const roles = (
    await Promise.all(slugs.map(async slug => await getRoleBySlug(slug)))
  ).filter(exists)
  const uniquePolicyIds = new Set(
    roles.flatMap(role => role.policyIds.map(policyId => policyId.toString())),
  )

  // resolve each policyId into a policy once.
  for (const policyId of uniquePolicyIds) {
    const policy = await getPolicy(policyId)
    if (policy) {
      policies.set(policyId, policy)
    }
  }

  // join policies onto roles.
  return roles.map(role => ({
    ...role,
    policies: role.policyIds
      .map(policyId => policies.get(policyId.toString()))
      .filter(exists),
  }))
}

export const getRoles = async <T extends boolean>({
  ids,
  slugs,
  policyIds,
  userIds,
  usernames,
  joinPolicies,
}: GetRolesArgs<T>): Promise<
  T extends false ? RBACRole[] : JoinedRBACRole[]
> => {
  const neededUserIds: string[] = []

  if (usernames) {
    const userIds = await getAllUserIdsByUserNamesLowerCase(usernames)
    neededUserIds.concat(userIds)
  }
  if (userIds) {
    neededUserIds.concat(userIds)
  }

  const filter = {
    ...(ids && { _id: { $in: ids } }),
    ...(slugs && { slug: { $in: slugs } }),
    ...(policyIds && { policyIds: { $in: policyIds } }),
    ...(neededUserIds.length > 0 && { userIds: neededUserIds }),
  }

  const matchStep = { $match: filter }
  const lookupStep = {
    $lookup: {
      from: policySchema.name,
      localField: 'policyIds',
      foreignField: '_id',
      as: 'policies',
    },
  }
  const aggregationSteps = joinPolicies ? [matchStep, lookupStep] : [matchStep]

  return await RBACRoleModel.aggregate(aggregationSteps)
}

export const updateRole = async (
  id: string,
  updatePayload: UpdatePayload<RBACRole>,
): Promise<RBACRole | null> => {
  const result = await RBACRoleModel.findOneAndUpdate(
    { _id: id },
    updatePayload,
    {
      new: true,
    },
  ).lean<RBACRole>()
  if (result) {
    await BasicCache.set(rbacRolesCacheName, result.slug, result, rbacRolesExp)
  }
  return result
}

export const assignUserIdToRole = async (
  roleId: string,
  userId: string,
): Promise<RBACRole | null> => {
  return await RBACRoleModel.findOneAndUpdate(
    {
      _id: roleId,
      userIds: { $ne: userId },
    },
    {
      $addToSet: {
        userIds: userId,
      },
    },
    {
      new: true,
    },
  ).lean<RBACRole>()
}

export const unassignUserIdFromRole = async (
  roleId: string,
  userId: string,
): Promise<RBACRole | null> => {
  return await RBACRoleModel.findOneAndUpdate(
    {
      _id: roleId,
    },
    {
      $pull: {
        userIds: userId,
      },
    },
    {
      new: true,
    },
  ).lean<RBACRole>()
}

export const deleteRoles = async (ids: string[]): Promise<void> => {
  const roles = await RBACRoleModel.find({ _id: { $in: ids } }).lean()
  // Delete, then invalidate so that another process doesn't hydrate the cache as we are deleting from Mongo.
  await RBACRoleModel.deleteMany({ _id: { $in: ids } })
  await Promise.allSettled([
    ...roles.map(async role => {
      await BasicCache.invalidate(rbacRolesCacheName, role.slug)
    }),
  ])
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: RBACRoleModel.collection.name,
}
