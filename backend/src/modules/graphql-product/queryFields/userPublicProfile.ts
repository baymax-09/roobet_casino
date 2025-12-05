import { queryField, nonNull } from 'nexus'

import { getUserById } from 'src/modules/user'
import { uuidArg } from 'src/util/graphql'

export const UserPublicProfileQueryField = queryField('userPublicProfile', {
  type: 'UserPublicProfile',
  args: { userId: nonNull(uuidArg()) },
  auth: {
    authenticated: true,
  },
  resolve: async (_, { userId }) => {
    return await getUserById(userId)
  },
})
