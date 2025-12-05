import React from 'react'
import { useImmer } from 'use-immer'
import { useSelector } from 'react-redux'

import { api, isApiError } from 'common/util'
import { useToasts } from 'common/hooks'
import { defaultSocket } from 'app/lib/sockets'

import { type MessageType } from './ChatMessage'

const MAX_MESSAGES = 25

// TODO: Better type the return.
export function useChatMessages(
  hidden,
): [boolean, MessageType[], Record<string, unknown>] {
  const [loading, setLoading] = React.useState(true)
  const [messages, updateMessages] = useImmer<MessageType[]>([])
  const [users, updateUsers] = useImmer<Record<string, number>>({})
  const { toast } = useToasts()

  // @todo: Need additional issue for comparing userMutes to prevent re-renders.
  const userMutes = useSelector(({ user }) => (user ? user.mutes : {}))

  const addUsers = React.useCallback(
    messages => {
      updateUsers(users => {
        for (const message of messages) {
          users[message.user.name] = new Date(message.timestamp).getTime()
        }

        const keys = Object.keys(users)

        if (keys.length > 50) {
          keys.sort((a, b) => users[b] - users[a])

          const deleted = keys.splice(40)

          for (const key of deleted) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete users[key]
          }
        }
      })
    },
    [updateUsers],
  )

  const addMessage = React.useCallback(
    message => {
      if (userMutes[message.userId]) {
        return
      }

      updateMessages(messages => {
        messages.push(message)

        if (messages.length > MAX_MESSAGES * 1.5) {
          messages.splice(0, messages.length - MAX_MESSAGES)
        }
      })
    },
    [updateMessages, userMutes],
  )

  React.useEffect(() => {
    const loadMessages = async () => {
      try {
        const messages = await api.get<null, MessageType[]>('/chat/latest')
        const filteredMessages = messages.filter(message => {
          return !userMutes[message.userId]
        })

        addUsers(filteredMessages)
        updateMessages(() => filteredMessages)
        setLoading(false)
      } catch (err) {
        if (isApiError(err)) {
          toast.error(err.response ? err.response.data : err.message)
        }
      }
    }

    if (!hidden) {
      loadMessages()
    } else {
      setLoading(true)
      updateMessages(() => [])
    }
  }, [hidden])

  React.useEffect(() => {
    if (loading) {
      return
    }

    const onMessage = message => {
      addUsers([message])
      addMessage(message)
    }

    const onDeleteMessage = id => {
      updateMessages(messages => messages.filter(message => message.id !== id))
    }

    const onDeleteAllMessages = userId => {
      updateMessages(messages =>
        messages.filter(message => message.userId !== userId),
      )
    }

    defaultSocket._socket.on('chat_message', onMessage)
    defaultSocket._socket.on('delete_message', onDeleteMessage)
    defaultSocket._socket.on('delete_all_messages', onDeleteAllMessages)

    return () => {
      defaultSocket._socket.off('chat_message', onMessage)
      defaultSocket._socket.off('delete_message', onDeleteMessage)
      defaultSocket._socket.off('delete_all_messages', onDeleteAllMessages)
    }
  }, [loading, addMessage, addUsers, updateMessages])

  return [loading, messages, users]
}
