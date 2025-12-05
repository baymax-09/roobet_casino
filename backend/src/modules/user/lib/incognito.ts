import { getSystemSetting } from 'src/modules/userSettings'

import { type User } from '../types/User'

export const shouldHideUser = async (user: User) =>
  (await getSystemSetting(user.id, 'feed', 'incognito')) ||
  user.isWhale ||
  (!user.twofactorEnabled && !user.emailVerified) ||
  user.role == 'VIP' ||
  user.role == 'HV'
