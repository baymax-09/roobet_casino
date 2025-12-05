import { addNoteToUser } from 'src/modules/admin/documents/user_notes'
import {
  type TogglableSystemName,
  changeSystemsEnabledUser,
} from 'src/modules/userSettings'
import { getUserById } from 'src/modules/user'
import { fraudLogger } from './lib/logger'

export async function lockDownUser(
  userId: string,
  systemsToDisable: TogglableSystemName[],
  activity: string,
) {
  await changeSystemsEnabledUser(userId, systemsToDisable, false)

  try {
    const user = await getUserById(userId)
    if (user) {
      await addNoteToUser(
        userId,
        user,
        `Automatically locked down user for ${activity} activity`,
        'userAction',
      )
    }
  } catch (error) {
    fraudLogger('lockDownUder', { userId }).error(
      `fraud/util::lockDownUser - Failed to add note to userId ${userId} for locking systems: ${systemsToDisable}`,
      { systemsToDisable, activity },
      error,
    )
  }
}

export async function unlockUser(
  userId: string,
  systemsToEnable: TogglableSystemName[],
) {
  await changeSystemsEnabledUser(userId, systemsToEnable, true)

  try {
    const user = await getUserById(userId)
    if (user) {
      await addNoteToUser(
        userId,
        user,
        'Automatically unlocked user',
        'userAction',
      )
    }
  } catch (error) {
    fraudLogger('unlockUser', { userId }).error(
      `fraud/util::unlockUser - Failed to add note to userId ${userId}`,
      { systemsToEnable },
      error,
    )
  }
}

export async function kycUserInfoToString(userId: string): Promise<string> {
  const user = await getUserById(userId)
  if (user) {
    const roleString = user.role ? ` ${user.role}` : ''
    return `${user.name} [${userId}] ${roleString}`
  }
  return `${userId}<Deleted?>`
}
