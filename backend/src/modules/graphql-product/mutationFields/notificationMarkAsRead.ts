import { mutationField, list } from 'nexus'

import {
  getNotificationsForUserId,
  markAllNotificationsRead,
} from 'src/modules/messaging/notifications/documents'

export const NotificationMarkAsReadMutationField = mutationField(
  'notificationMarkAsRead',
  {
    description: 'Mark all notifications as read.',
    type: list('NotificationMessage'),
    args: {},
    auth: {
      authenticated: true,
    },
    resolve: async (_, __, { user }) => {
      if (!user?.id) {
        return null
      }

      await markAllNotificationsRead(user.id)

      return await getNotificationsForUserId(user.id)
    },
  },
)
