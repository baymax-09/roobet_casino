import { mutationField, nonNull, inputObjectType, objectType } from 'nexus'

import {
  deletePolicies,
  getPolicy,
} from 'src/modules/rbac/documents/RBACPolicies'
import { GraphQLError } from 'graphql'

const RBACPolicyDeleteInput = inputObjectType({
  name: 'PolicyDeleteInput',
  definition(type) {
    type.nonNull.list.nonNull.nonEmptyString('ids', {
      auth: null,
      description: 'The id of the policies you are trying to delete.',
    })
  },
})

/** @todo graphql mutation should return objects from the graph. */
const RBACPolicyDeleteType = objectType({
  name: 'DeletePolicyResponse',
  definition(type) {
    type.nonNull.list.nonNull.nonEmptyString('ids')
  },
})

export const RBACPolicyDeleteMutationField = mutationField('RbacPolicyDelete', {
  description: 'Delete Policies.',
  type: nonNull(RBACPolicyDeleteType),
  args: { data: nonNull(RBACPolicyDeleteInput) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'user_roles', action: 'delete' }],
  },
  resolve: async (_, { data }) => {
    const { ids } = data

    for (const policy of ids) {
      const policyId = await getPolicy(String(policy))
      if (!policyId) {
        throw new GraphQLError(`policy ID (${policy}) does not exist.`)
      }
    }
    await deletePolicies(ids)
    return { ids }
  },
})
