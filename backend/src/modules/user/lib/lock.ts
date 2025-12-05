import moment from 'moment'

import { type Types as UserTypes } from 'src/modules/user'
import { lockOrUnlockUser, updateUser } from 'src/modules/user'

export async function userIsLocked(
  user?: UserTypes.User | UserTypes.DBUser,
): Promise<boolean> {
  if (!user) {
    return false
  }

  if (!user.lockedUntil) {
    return false
  }

  if (moment(user.lockedUntil) < moment()) {
    if (user.lockedUntil) {
      await unlockUser(user.id)
    }
    return false
  }

  return true
}

export async function timedLockUser(
  userId: string,
  lockReason: string,
  time: string,
) {
  await updateUser(userId, {
    lockedUntil: moment(time).toISOString(),
    lockReason,
  })
}

export async function lockUser(userId: string, reason: string) {
  return await lockOrUnlockUser(userId, true, reason)
}

export async function unlockUser(userId: string) {
  return await lockOrUnlockUser(userId, false)
}
