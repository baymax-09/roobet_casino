import { queryField, list } from 'nexus'

import {
  getAllMessagesWithReadReceipts,
  type Message,
} from 'src/modules/messaging/messages'
import { type Notification } from 'src/modules/messaging'
import { getNotificationsForUserId } from 'src/modules/messaging/notifications/documents/notification'

const LIMIT = 10

const getRecordDatetime = (record: Partial<Message> | Notification): number => {
  if ('liveAt' in record) {
    return new Date(record.liveAt ?? 0).getTime()
  }

  return new Date(record.createdAt ?? 0).getTime()
}

const removeRecipients = (messages: Message[]) =>
  messages.map<Omit<Message, 'recipients'>>(
    ({ recipients, ...message }) => message,
  )

export const getAllNotificationMessages = async (userId: string) => {
  // Get messages sent to all users, determine if they are read.
  const mappedMessages = await getAllMessagesWithReadReceipts(userId)

  // Get notifications messages sent to a specific user.
  const userNotifications = await getNotificationsForUserId(userId)

  const combined = [...userNotifications, ...removeRecipients(mappedMessages)]

  // Sort and limit to the most recent 10 documents.
  return combined
    .sort((a, b) => getRecordDatetime(b) - getRecordDatetime(a))
    .slice(0, LIMIT)
}

export const NotificationsQueryField = queryField('notifications', {
  type: list('NotificationMessage'),
  auth: { authenticated: true },
  resolve: async (_, __, { user }) => {
    if (!user?.id) {
      return null
    }

    return await getAllNotificationMessages(user.id)
  },
})
