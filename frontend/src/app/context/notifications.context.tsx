import React from 'react'
import { useLazyQuery } from '@apollo/client'
import { useSelector } from 'react-redux'

import { NotificationsQuery, type NotificationsQueryData } from 'app/gql'
import { initiateRichInbox } from 'common/util'
import { getPusherInstance } from 'common/util/pusher'
import { usePusherChannels, getRichInboxMessages } from 'app/components'
import { useAppReady, useIsLoggedIn } from 'app/hooks'
import { type Message, type Notification } from 'app/components/Messaging/types'

interface NotificationsContextType {
  fetchRichInboxMessages: () => Promise<void>
  allItems: any[]
  unreadMessages: number
  richInboxMetadata: {
    fusionUrl: string | null
    richInboxAuthToken: string | null
    fastTrackUserId: number | null
  }
  hasMrRooMessages: any
  setRichInboxMessages: React.Dispatch<
    React.SetStateAction<Array<Notification | Message> | null>
  >
}

const LIMIT = 10

const getRecordDatetime = record => {
  if ('liveAt' in record) {
    return new Date(record.liveAt ?? 0).getTime()
  }
  return new Date(record.createdAt ?? 0).getTime()
}

const NotificationsContext = React.createContext<NotificationsContextType>({
  fetchRichInboxMessages: async () => {},
  allItems: [],
  unreadMessages: 0,
  richInboxMetadata: {
    fusionUrl: null,
    richInboxAuthToken: null,
    fastTrackUserId: null,
  },
  hasMrRooMessages: false,
  setRichInboxMessages: () => {},
})

export const useNotificationsContext = () =>
  React.useContext(NotificationsContext)

export const NotificationsProvider = ({ children }) => {
  const [richInboxMetadata, setRichInboxMetadata] = React.useState<{
    fusionUrl: string | null
    richInboxAuthToken: string | null
    fastTrackUserId: number | null
  }>({ fusionUrl: null, richInboxAuthToken: null, fastTrackUserId: null })
  const [richInboxMessages, setRichInboxMessages] = React.useState<Array<
    Notification | Message
  > | null>(null)
  const [pusher, setPusher] = React.useState<unknown>(null)

  const fasttrackToken = useSelector(({ user }) => user?.fasttrackToken)
  const isLoggedIn = useIsLoggedIn()
  const appReady = useAppReady()

  const [refetch, { data }] =
    useLazyQuery<NotificationsQueryData>(NotificationsQuery)

  const items = React.useMemo(() => data?.notifications ?? [], [data])
  const richInboxItems = React.useMemo(
    () => richInboxMessages ?? [],
    [richInboxMessages],
  )

  const allItems = React.useMemo(() => {
    return [...items, ...richInboxItems]
      .sort((a, b) => getRecordDatetime(b) - getRecordDatetime(a))
      .slice(0, LIMIT)
  }, [items, richInboxItems])

  const unreadMessages = React.useMemo(
    () => allItems.reduce((count, item) => (item.read ? count : count + 1), 0),
    [allItems],
  )

  const fetchRichInboxMessages = React.useCallback(async () => {
    const { fastTrackUserId, fusionUrl, richInboxAuthToken } = richInboxMetadata
    const richInboxMessages = await getRichInboxMessages({
      fastTrackUserId,
      fusionUrl,
      richInboxAuthToken,
    })
    setRichInboxMessages(richInboxMessages)
  }, [richInboxMetadata])

  React.useEffect(() => {
    const handleRichInboxMessages = async () => {
      // Setup Fast Track CRM supplied Rich Inbox
      const result = await initiateRichInbox()
      if (result) {
        const { fusionUrl, richInboxAuthToken, fastTrackUserId } = result
        setPusher(await getPusherInstance())
        setRichInboxMetadata({
          fusionUrl,
          richInboxAuthToken,
          fastTrackUserId,
        })
      }
    }
    if (fasttrackToken) {
      handleRichInboxMessages()
    }
  }, [fasttrackToken])

  React.useEffect(() => {
    if (fasttrackToken && richInboxMetadata.fusionUrl) {
      fetchRichInboxMessages()
    }
  }, [richInboxMetadata.fusionUrl, fasttrackToken, fetchRichInboxMessages])

  // Fetch notifications when the app loads, or the auth state changes.
  React.useEffect(() => {
    if (appReady && isLoggedIn) {
      refetch()
    }
  }, [appReady, refetch, isLoggedIn])

  usePusherChannels(
    richInboxMetadata.fastTrackUserId,
    pusher,
    fetchRichInboxMessages,
  )

  const hasMrRooMessages = allItems.find(
    item => item.__typename === 'Message' && !item.read,
  )

  const contextValue = {
    fetchRichInboxMessages,
    allItems,
    unreadMessages,
    richInboxMetadata,
    hasMrRooMessages,
    setRichInboxMessages,
  }

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  )
}
