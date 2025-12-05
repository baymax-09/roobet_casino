import { queryField, list, nonNull, arg, inputObjectType } from 'nexus'

import { getRoles } from 'src/modules/rbac/documents/RBACRoles'

const RBACRolesInputType = inputObjectType({
  name: 'RolesInputType',
  definition(type) {
    type.list.nonNull.objectId('ids')
    type.list.nonNull.string('slugs')
    type.list.nonNull.objectId('policyIds')
    type.list.nonNull.string('usernames')
    type.list.nonNull.string('userIds')
  },
})

export const RBACRolesQueryField = queryField('roles', {
  type: nonNull(list(nonNull('Role'))),
  description: 'Get all roles with filter',
  args: {
    input: nonNull(arg({ type: RBACRolesInputType })),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'user_roles', action: 'read' }],
  },
  resolve: async (_, { input }) => {
    const { ids, slugs, policyIds, usernames, userIds } = input
    return await getRoles({
      ids,
      slugs,
      policyIds,
      usernames,
      userIds,
      joinPolicies: true,
    })
  },
})
