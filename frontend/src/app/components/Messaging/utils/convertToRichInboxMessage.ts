import { type Message, type Notification, type ExistingMessage } from '../types'

// Rich inbox messages don't come in with the right format
// Ex: 2023-02-01 23:42:35
// Should be: 2023-02-01T23:42:35Z
const convertUTCTimestampToUTCFormat = (utcTimestamp: string) => {
  return utcTimestamp.replace(' ', 'T') + 'Z'
}

export const convertToRichInboxMessage = (
  message: ExistingMessage,
  userId: number,
): Message => ({
  id: String(message.MessageId),
  __typename: 'Message',
  title: message.Title,
  body: message.Message,
  link: message.CTAButtonLink,
  recipients: [userId],
  heroImage: message.ImageUrl,
  logoImage: null,
  featuredImage: null,
  live: true,
  liveAt: convertUTCTimestampToUTCFormat(message.Date),
  read: message.IsRead,
  meta: {
    richInboxMessageId: message.MessageId,
  },
})

export const convertToRichInboxNotification = (
  message: ExistingMessage,
  userId: number,
): Notification => ({
  id: String(message.MessageId),
  __typename: 'Notification',
  userId,
  message: message.Message,
  read: message.IsRead,
  type: 'richInbox',
  createdAt: convertUTCTimestampToUTCFormat(message.Date),
  meta: {
    richInboxMessageId: message.MessageId,
  },
})
