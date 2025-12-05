import { mutationField, nonNull, inputObjectType } from 'nexus'
import { GraphQLError } from 'graphql'

import { getRole, updateRole } from 'src/modules/rbac/documents/RBACRoles'
import { updateUserRole } from 'src/modules/user'
import { getRecipientsByNameOrId } from 'src/modules/messaging/messages'

const RBACRoleUpdateInput = inputObjectType({
  name: 'RoleUpdateInput',
  definition(type) {
    type.nonNull.id('id', {
      auth: null,
      description: 'The id of the role.',
    })
    type.nonNull.nonEmptyString('name', {
      auth: null,
      description: 'The name of the role.',
    })
    type.nonNull.nonEmptyString('slug', {
      auth: null,
      description: 'The slug used for the role.',
    })
    type.nonNull.list.nonNull.nonEmptyString('userIds', {
      auth: null,
      description: 'The users that have access to this role.',
    })
    type.nonNull.list.nonNull.objectId('policyIds', {
      auth: null,
      description: 'The policies attached to this role.',
    })
  },
})

export const RBACRoleUpdateMutationField = mutationField('rbacRoleUpdate', {
  description: 'Update a role.',
  type: 'Role',
  args: { data: nonNull(RBACRoleUpdateInput) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'user_roles', action: 'update' }],
  },
  resolve: async (_, { data }) => {
    const { id, ...payload } = data
    const role = await getRole(id)

    const authorizedUserIds = await getRecipientsByNameOrId(data.userIds)
    payload.userIds = authorizedUserIds ?? []

    if (!role) {
      throw new GraphQLError('Role does not exist.')
    }

    const updatedRole = await updateRole(id, payload)

    if (updatedRole) {
      await Promise.all(
        updatedRole.userIds.map(async user => {
          await updateUserRole(user, id)
        }),
      )
      // remove role from user
      await Promise.all(
        role.userIds.map(async user => {
          if (!updatedRole.userIds.includes(user)) {
            await updateUserRole(user, id)
          }
        }),
      )
    }
    return updatedRole
  },
})
