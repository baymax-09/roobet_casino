import { isSystemEnabled } from 'src/modules/userSettings'
import { type User } from 'src/modules/user/types/User'

export async function shouldRecordStatsForUser(user?: User) {
  if (!user) {
    return true
  }
  const statsEnabled = await isSystemEnabled(user, 'stats')
  return !user.staff && statsEnabled
}

export * from './rank'
