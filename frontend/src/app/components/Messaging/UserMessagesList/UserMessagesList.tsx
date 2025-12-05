import React from 'react'
import { useMutation } from '@apollo/client'
import { type PopupState } from 'material-ui-popup-state/core'
import { Typography, theme as uiTheme } from '@project-atl/ui'

import NoNotifications from 'assets/icons/notifications/NoNotifications.svg'
import { useTranslate } from 'app/hooks'
import { MessageCard, NotificationCard } from 'common/components'
import {
  NotificationMarkAsReadMutation,
  MessageMarkAsReadMutation,
  NotificationsQuery,
} from 'app/gql'
import { useNotificationsContext } from 'app/context'

import {
  markRichInboxNotificationsAsRead,
  markRichInboxMessageAsRead,
} from '../utils'

import { useUserMessagesListStyles } from './UserMessagesList.styles'

interface Tab {
  key: string
  label: string
  customFilter?: (item: any) => boolean
}
interface UserMessagesListProps {
  popupState?: PopupState
  tabs: Tab[]
  currentTab: string
}

const NoItems: React.FC = () => {
  const classes = useUserMessagesListStyles()
  const translate = useTranslate()

  return (
    <div className={classes.NoItemsContainer}>
      <NoNotifications />
      <Typography
        variant="body2"
        fontWeight={uiTheme.typography.fontWeightBold}
        color={uiTheme.palette.common.white}
      >
        {translate('messaging.noMessages')}
      </Typography>
    </div>
  )
}

export const UserMessagesList: React.FC<UserMessagesListProps> = ({
  popupState,
  tabs,
  currentTab,
}) => {
  const classes = useUserMessagesListStyles()

  const {
    fetchRichInboxMessages,
    richInboxMetadata,
    unreadMessages,
    allItems: items,
    setRichInboxMessages,
  } = useNotificationsContext()

  /**
   * Marking the local rich inbox messages as read to keep in sync with the markAllAsRead mutation
   */
  const markRichInboxAsRead = React.useCallback(
    () =>
      setRichInboxMessages(
        prev => prev?.map(message => ({ ...message, read: true })) ?? null,
      ),
    [],
  )

  const [notificationMarkAllRead] = useMutation(
    NotificationMarkAsReadMutation,
    {
      // Refetch notifications after marking as read.
      refetchQueries: [NotificationsQuery],
    },
  )

  const [messageMarkAsRead] = useMutation(MessageMarkAsReadMutation, {
    // Refetch notifications after marking as read.
    refetchQueries: [NotificationsQuery],
  })

  const hasUnread = unreadMessages > 0

  const filteredItems = React.useMemo(() => {
    const { customFilter } = tabs.find(tab => tab.key === currentTab) ?? {}
    if (!customFilter) {
      return items
    }

    return items.filter(customFilter)
  }, [items, tabs, currentTab])

  // Mark all notifications as read when notifications popup closes.
  React.useEffect(() => {
    const markAllNotificationsAsRead = async () => {
      if (hasUnread) {
        messageMarkAsRead({ variables: { data: { id: null } } })
        notificationMarkAllRead()
        const richInboxNotificationMessageIds = filteredItems
          .filter(item => item.meta?.richInboxMessageId && !item.read)
          .map(item => item.meta.richInboxMessageId)
        // Mark all notifications as read
        if (
          richInboxMetadata.richInboxAuthToken &&
          richInboxMetadata.fusionUrl
        ) {
          await markRichInboxNotificationsAsRead({
            messageIds: richInboxNotificationMessageIds,
            fusionUrl: richInboxMetadata.fusionUrl,
            richInboxAuthToken: richInboxMetadata.richInboxAuthToken,
          })
        }
        await fetchRichInboxMessages()
        markRichInboxAsRead()
      }
    }
    return () => {
      markAllNotificationsAsRead()
    }
  }, [richInboxMetadata])

  const markAsReadInternal = React.useCallback(
    (id: string) => {
      messageMarkAsRead({
        variables: { data: { id: [id] } },
      })
    },
    [messageMarkAsRead],
  )

  return (
    <div className={classes.UserMessageList}>
      {filteredItems.length === 0 && <NoItems />}
      {filteredItems.map(doc => {
        if (doc.__typename === 'Message') {
          return (
            <div key={doc.id} className={classes.MessageItems__item}>
              <MessageCard
                message={doc}
                onClick={async () => {
                  // Mark as read on click.
                  if (!doc.read) {
                    if (!doc.meta?.richInboxMessageId) {
                      markAsReadInternal(doc.id)
                    }
                    if (
                      doc.meta?.richInboxMessageId &&
                      richInboxMetadata.fusionUrl &&
                      richInboxMetadata.richInboxAuthToken
                    ) {
                      // Fast Track messages
                      const result = await markRichInboxMessageAsRead({
                        messageId: doc.meta.richInboxMessageId,
                        fusionUrl: richInboxMetadata.fusionUrl,
                        richInboxAuthToken:
                          richInboxMetadata.richInboxAuthToken,
                      })
                      // Refetch messages if successful
                      if (result && result.Success) {
                        await fetchRichInboxMessages()
                        markRichInboxAsRead()
                      }
                    }
                  }
                  // Close popup if message has link.
                  if (doc.link) {
                    popupState?.close()
                  }
                }}
              />
            </div>
          )
        }

        if (doc.__typename === 'Notification') {
          return (
            <div key={doc.id} className={classes.MessageItems__item}>
              <NotificationCard
                notification={doc}
                popupState={popupState}
                markAsReadInternal={markAsReadInternal}
              />
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
