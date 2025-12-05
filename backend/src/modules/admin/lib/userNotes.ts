import { type Types as UserTypes } from 'src/modules/user'

import { addNoteToUser } from '../documents/user_notes'
import { adminLogger } from './logger'

export const addAdminNoteToUser = (
  userId: string,
  staffUser: UserTypes.User,
  note: string,
) => {
  addNoteToUser(userId, staffUser, note).catch(error => {
    adminLogger('addAdminNoteToUser', { userId }).error(
      'Failed to add admin note to user',
      { staffUserId: staffUser.id, note },
      error,
    )
  })
}
