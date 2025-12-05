import { logEvent } from 'common/util'

interface NotificationResponse {
  Success: boolean
  Data: boolean
  Errors: any[]
}

interface MarkMessageAsReadArgs {
  messageId: number
  fusionUrl: string | null
  richInboxAuthToken: string | null
}

interface MarkNotificationAsReadArgs {
  messageIds: number[]
  fusionUrl: string | null
  richInboxAuthToken: string | null
}

// Mark a specific notification as read:
const markNotificationAsRead = async ({
  messageId,
  fusionUrl,
  richInboxAuthToken,
}: MarkMessageAsReadArgs) => {
  if (!fusionUrl || !richInboxAuthToken) {
    return
  }
  try {
    const response = await fetch(
      `${fusionUrl}/Notifications/MarkNotificationAsRead`,
      {
        method: 'POST',
        credentials: 'omit',
        headers: { authtoken: richInboxAuthToken },
        body: JSON.stringify({ MessageId: messageId }),
      },
    )
    const data: NotificationResponse = await response.json()
    if (data.Errors.length > 0) {
      logEvent(
        'Error when marking rich inbox message as read',
        { errors: data.Errors },
        'warn',
      )
    }
    return data
  } catch (error) {
    logEvent(
      `Error when marking rich inbox message as read. Message ID: ${messageId}`,
      { error },
      'warn',
    )
  }
}

export const markRichInboxMessageAsRead = async ({
  messageId,
  fusionUrl,
  richInboxAuthToken,
}: MarkMessageAsReadArgs) => {
  if (!fusionUrl || !richInboxAuthToken) {
    return
  }
  return await markNotificationAsRead({
    messageId,
    fusionUrl,
    richInboxAuthToken,
  })
}

export const markRichInboxNotificationsAsRead = async ({
  messageIds,
  fusionUrl,
  richInboxAuthToken,
}: MarkNotificationAsReadArgs) => {
  if (!fusionUrl || !richInboxAuthToken) {
    return
  }
  const notificationReadCalls = messageIds.map(async notification => {
    return markNotificationAsRead({
      messageId: notification,
      fusionUrl,
      richInboxAuthToken,
    })
  })
  return await Promise.all(notificationReadCalls)
}
