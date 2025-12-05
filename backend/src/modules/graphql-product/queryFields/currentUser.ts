import { queryField } from 'nexus'

import { getUserById } from 'src/modules/user'

export const CurrentUserQueryField = queryField('currentUser', {
  type: 'User',
  auth: {
    authenticated: true,
  },
  resolve: async (_, __, { user }) => {
    if (!user) {
      return null
    }
    return await getUserById(user.id)
  },
})
