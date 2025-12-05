import { mutationField, nonNull, inputObjectType } from 'nexus'
import { GraphQLError } from 'graphql'

import { setUserRoles, getUserById } from 'src/modules/user'

import {
  getRoleBySlug,
  assignUserIdToRole,
  unassignUserIdFromRole,
} from 'src/modules/rbac/documents/RBACRoles'

const UserUpdateRBACRolesInput = inputObjectType({
  name: 'UserRolesUpdateInput',
  definition(type) {
    type.nonNull.list.nonNull.objectId('roleIds', {
      auth: null,
      description: 'The ids of the roles to assign to the user.',
    })
    type.nonNull.id('userId', {
      auth: null,
      description: 'The id of the user.',
    })
  },
})

export const UserUpdateRBACRolesMutationField = mutationField(
  'rbacUserRolesUpdate',
  {
    description: 'Assign a list of roles to a user.',
    type: nonNull('User'),
    args: { data: nonNull(UserUpdateRBACRolesInput) },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'user_roles', action: 'update' }],
    },
    resolve: async (_, { data }) => {
      const { roleIds, userId } = data
      const oldUser = await getUserById(userId)
      const oldRoleSlugs = oldUser?.roles ?? []

      if (!oldUser) {
        throw new GraphQLError('User does not exist.')
      }

      await setUserRoles(userId, roleIds)

      const newUser = await getUserById(userId)
      const newRoleSlugs = newUser?.roles ?? []

      if (!newUser) {
        throw new GraphQLError('User does not exist.')
      }

      for (const slug of oldRoleSlugs) {
        if (!newRoleSlugs.includes(slug)) {
          // Remove the user from the role
          const role = await getRoleBySlug(slug)
          if (role) {
            await unassignUserIdFromRole(role._id.toString(), userId)
          }
        }
      }
      for (const slug of newRoleSlugs) {
        if (!oldRoleSlugs.includes(slug)) {
          // Add the user to the role
          const role = await getRoleBySlug(slug)
          if (role) {
            await assignUserIdToRole(role._id.toString(), userId)
          }
        }
      }
      return newUser
    },
  },
)
