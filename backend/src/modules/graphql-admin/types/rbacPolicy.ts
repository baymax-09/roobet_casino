import { enumType, objectType } from 'nexus'

import { PolicyEffects } from 'src/modules/rbac/types'

export const PolicyEffectEnumType = enumType({
  name: 'PolicyEffectType',
  description: 'The type of effect in place.',
  members: PolicyEffects,
})

export const RBACPolicyType = objectType({
  name: 'Policy',
  sourceType: {
    module: __dirname,
    export: 'DBPolicy',
  },
  definition(type) {
    type.nonNull.objectId('id', {
      auth: null,
      description: 'The unique identifier of this policy.',
      resolve: ({ _id }) => _id,
    })
    type.nonNull.field('effect', {
      auth: null,
      description: 'The effect in place for the policy.',
      type: PolicyEffectEnumType,
    })
    type.nonNull.string('name')
    type.nonNull.string('slug')
    type.nonNull.list.nonNull.string('rules')
  },
})
