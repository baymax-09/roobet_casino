import React from 'react'
import { useMutation } from '@apollo/client'
import { useHistory } from 'react-router-dom'

import { MessageCreateMutation } from 'admin/gql'
import { useToasts } from 'common/hooks'

import { MessageForm } from '../MessageForm'

export const MessageCreate: React.FC = () => {
  const history = useHistory()
  const { toast } = useToasts()

  const [messageCreate] = useMutation(MessageCreateMutation, {
    onError: ({ message }) => {
      toast.error(message)
    },
  })

  const onSubmit = async (values, send) => {
    // By the time this gets called, we can be confident the values are all present.
    const result = await messageCreate({ variables: { data: values } })

    if (result.errors) {
      return
    }

    if (send) {
      const id = result.data.messageCreate.id
      history.push(`/messaging/mailbox/${id}/send`)
      return
    }

    if (result.data?.messageCreate?.id) {
      toast.success('Message created.')
    }

    history.push('/messaging/mailbox')
  }

  return (
    <MessageForm
      title="Create Message"
      initialValues={{}}
      onSubmit={onSubmit}
    />
  )
}
