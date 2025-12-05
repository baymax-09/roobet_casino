import { mutationField, nonNull, inputObjectType } from 'nexus'
import { GraphQLError } from 'graphql'

import {
  getPolicy,
  updatePolicy,
} from 'src/modules/rbac/documents/RBACPolicies'

const RBACPolicyUpdateInput = inputObjectType({
  name: 'PolicyUpdateInput',
  definition(type) {
    type.nonNull.id('id', {
      auth: null,
      description: 'The id of the policy.',
    })
    type.nonNull.nonEmptyString('name', {
      auth: null,
      description: 'The name of the policy.',
    })
    type.nonNull.nonEmptyString('slug', {
      auth: null,
      description: 'The slug used for the policy',
    })
    type.nonNull.list.nonNull.nonEmptyString('rules', {
      auth: null,
      description: 'Rules applied to the rbac policy.',
    })
    type.nonNull.field('effect', {
      auth: null,
      description: 'Effect of the role.',
      type: 'PolicyEffectType',
    })
  },
})

export const RBACPolicyUpdateMutationField = mutationField('rbacPolicyUpdate', {
  description: 'Update a policy.',
  type: 'Policy',
  args: { data: nonNull(RBACPolicyUpdateInput) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'user_roles', action: 'update' }],
  },
  resolve: async (_, { data }) => {
    const { id, ...payload } = data
    const policy = await getPolicy(id)

    if (!policy) {
      throw new GraphQLError('Policy does not exist.')
    }

    return await updatePolicy(id, payload)
  },
})
