import gql from 'graphql-tag'

import { type Notification, type Message } from 'app/components/Messaging/types'

export interface NotificationsQueryData {
  notifications: Array<Notification | Message>
}

// NOTE: Using a fragment with union types causes
// issues with Apollo's cache... for some reason.

export const NotificationMarkAsReadMutation = gql`
  mutation NotificationMarkAsRead {
    notificationMarkAsRead {
      ... on Notification {
        id
        message
        read
        type
        createdAt
        meta
      }
    }
  }
`

export const MessageMarkAsReadMutation = gql`
  mutation MessageMarkAsRead($data: MessageMarkAsReadInput!) {
    messageMarkAsRead(data: $data) {
      success
    }
  }
`

export const NotificationsQuery = gql`
  query Notifications {
    notifications {
      __typename
      ... on Notification {
        id
        message
        read
        type
        createdAt
        meta
      }
      ... on Message {
        id
        title
        body
        heroImage
        link
        liveAt
        read
        createdAt
      }
    }
  }
`
