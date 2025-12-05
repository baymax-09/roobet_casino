import { logEvent } from 'common/util'

import {
  convertToRichInboxMessage,
  convertToRichInboxNotification,
} from './convertToRichInboxMessage'
import {
  type Message,
  type Notification,
  type ExistingMessagesResponse,
} from '../types'

interface GetRichInboxArgs {
  fastTrackUserId: number | null
  fusionUrl: string | null
  richInboxAuthToken: string | null
}

// API call to get existing messages for user
export const fetchExistingRichInboxMessages = async (
  fusionUrl: string,
  authToken: string,
  fastTrackUserId: number,
): Promise<ExistingMessagesResponse | undefined> => {
  if (!fusionUrl || !authToken) {
    return undefined
  }
  try {
    const response = await fetch(
      `${fusionUrl}/Notifications/v2/user-notifications?unread-only=false&inbox-only=true`,
      { method: 'GET', credentials: 'omit', headers: { authtoken: authToken } },
    )
    return await response.json()
  } catch (error) {
    logEvent(
      `Error when fetching rich inbox existing messages. fastTrackUserId: ${fastTrackUserId}`,
      { error },
      'warn',
    )
    return undefined
  }
}

export const getRichInboxMessages = async ({
  fastTrackUserId,
  fusionUrl,
  richInboxAuthToken,
}: GetRichInboxArgs) => {
  if (!fusionUrl || !richInboxAuthToken || !fastTrackUserId) {
    return []
  }

  // Get rich inbox messages
  const unreadRichInboxMessagesResponse = await fetchExistingRichInboxMessages(
    fusionUrl,
    richInboxAuthToken,
    fastTrackUserId,
  )

  if (
    !unreadRichInboxMessagesResponse ||
    !unreadRichInboxMessagesResponse.Success
  ) {
    logEvent('Unable to fetch unread rich inbox messages', {}, 'warn')
    return []
  }

  if (unreadRichInboxMessagesResponse.Data.length === 0) {
    return []
  }

  const richInboxMessages: Array<Notification | Message> = []

  // Filter/map through each of the rich inbox silent messages
  const messages = unreadRichInboxMessagesResponse.Data.filter(
    message => message.DisplayType === 'silent',
  ).map(message => convertToRichInboxMessage(message, fastTrackUserId))

  if (messages.length > 0) {
    richInboxMessages.push(...messages)
  }

  // Filter/map through each of the rich inbox push notifications
  const notifications = unreadRichInboxMessagesResponse.Data.filter(
    message => message.DisplayType === 'push',
  ).map(message => convertToRichInboxNotification(message, fastTrackUserId))

  if (notifications.length > 0) {
    richInboxMessages.push(...notifications)
  }

  return richInboxMessages
}
