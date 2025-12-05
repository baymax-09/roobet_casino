import { mutationField, nonNull, inputObjectType } from 'nexus'

import { createPolicy } from 'src/modules/rbac/documents/RBACPolicies'

const RbacPolicyCreateInput = inputObjectType({
  name: 'RbacPolicyCreateInput',
  definition(type) {
    type.nonNull.nonEmptyString('name', {
      auth: null,
      description: 'The name of the policy.',
    })
    type.nonNull.nonEmptyString('slug', {
      auth: null,
      description: 'Slug used for the policy',
    })
    type.nonNull.field('effect', {
      auth: null,
      description: 'Effect of the role.',
      type: 'PolicyEffectType',
    })
    type.nonNull.list.nonNull.nonEmptyString('rules', {
      auth: null,
      description: 'Rules applied to the rbac role.',
    })
  },
})

export const RBACPolicyCreateMutationField = mutationField('rbacPolicyCreate', {
  description: 'Create an RBAC policy.',
  type: nonNull('Policy'),
  args: { data: nonNull(RbacPolicyCreateInput) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'user_roles', action: 'create' }],
  },
  resolve: async (_, { data }) => {
    // @ts-expect-error need to make a GQL type with validation for RBACRule rather than just string
    return await createPolicy(data)
  },
})
