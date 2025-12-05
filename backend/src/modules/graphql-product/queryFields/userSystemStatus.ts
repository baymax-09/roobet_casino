import { queryField, nonNull, stringArg } from 'nexus'

import { checkSystemEnabledSafely } from 'src/modules/userSettings/lib'
import {
  isTogglableSystemName,
  isValidSystemName,
} from 'src/modules/userSettings/lib/settings_schema'

export const UserSystemStatusQueryField = queryField('userSystemStatus', {
  description: 'Get the current status of a given user system.',
  type: 'UserSystemStatus',
  args: {
    systemName: nonNull(stringArg()),
  },
  auth: {
    authenticated: true,
  },
  resolve: async (_, { systemName }, { user }) => {
    if (!user) {
      return null
    }

    if (!isValidSystemName(systemName) || !isTogglableSystemName(systemName)) {
      return null
    }

    return await checkSystemEnabledSafely(user, systemName)
  },
})
