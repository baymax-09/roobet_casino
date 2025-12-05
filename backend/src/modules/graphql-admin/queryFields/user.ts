import { queryField, nonNull } from 'nexus'

import { getUserById } from 'src/modules/user'
import { uuidArg } from 'src/util/graphql'

export const UserQueryField = queryField('user', {
  type: 'User',
  args: { userId: nonNull(uuidArg()) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'account', action: 'read' }],
  },
  resolve: async (_, { userId }) => {
    return await getUserById(userId)
  },
})
