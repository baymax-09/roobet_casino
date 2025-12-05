import { objectType } from 'nexus'

export const UserPublicProfileType = objectType({
  name: 'UserPublicProfile',
  sourceType: {
    module: __dirname,
    export: 'DBUser',
  },
  definition(type) {
    type.nonNull.uuid('id')
  },
})
