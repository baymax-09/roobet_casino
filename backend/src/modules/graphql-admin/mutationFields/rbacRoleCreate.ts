import { mutationField, nonNull, inputObjectType } from 'nexus'
import { getRecipientsByNameOrId } from 'src/modules/messaging/messages'
import { updateUserRole } from 'src/modules/user'

import { createRole } from 'src/modules/rbac/documents/RBACRoles'

const RbacRoleCreateInput = inputObjectType({
  name: 'RbacRoleCreateInput',
  definition(type) {
    type.nonNull.nonEmptyString('name', {
      auth: null,
      description: 'The name of role.',
    })
    type.nonNull.nonEmptyString('slug', {
      auth: null,
      description: 'The slug used for the role',
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

export const RBACRoleCreateMutationField = mutationField('rbacRoleCreate', {
  description: 'Create an RBAC role.',
  type: nonNull('Role'),
  args: { data: nonNull(RbacRoleCreateInput) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'user_roles', action: 'create' }],
  },
  resolve: async (_, { data }) => {
    // converts usernames to userIds and applies to role
    const authorizedUserIds = await getRecipientsByNameOrId(data.userIds)
    data.userIds = authorizedUserIds ?? []

    const createdRole = await createRole(data)
    if (createdRole) {
      // update roles to users
      await Promise.all(
        createdRole.userIds.map(async user => {
          await updateUserRole(user, createdRole._id.toString())
        }),
      )
    }
    return createdRole
  },
})
