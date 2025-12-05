import { objectType } from 'nexus'

export const RBACRoleType = objectType({
  name: 'Role',
  sourceType: {
    module: __dirname,
    export: 'DBRole',
  },
  definition(type) {
    type.nonNull.objectId('id', {
      auth: null,
      description: 'The unique identifier of this role.',
      resolve: ({ _id }) => _id,
    })
    type.nonNull.string('name')
    type.nonNull.string('slug')
    type.nonNull.list.nonNull.string('userIds')
    type.nonNull.list.nonNull.objectId('policyIds')
    type.list.nonNull.field('policies', {
      type: 'Policy',
      auth: null,
    })
  },
})
