import { queryField, list, nonNull, inputObjectType, arg } from 'nexus'

import { getPolicies } from 'src/modules/rbac/documents/RBACPolicies'

const RBACPoliciesInputType = inputObjectType({
  name: 'PoliciesInputType',
  definition(type) {
    type.list.nonNull.objectId('ids')
    type.list.nonNull.string('names')
    type.list.nonNull.string('resources')
  },
})

export const RBACPoliciesQueryField = queryField('policies', {
  type: nonNull(list(nonNull('Policy'))),
  description: 'Get all Policies with filter',
  args: {
    input: nonNull(arg({ type: RBACPoliciesInputType })),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'user_roles', action: 'read' }],
  },
  resolve: async (_, { input }) => {
    const { ids, names, resources } = input
    return await getPolicies({ ids, names, resources })
  },
})
