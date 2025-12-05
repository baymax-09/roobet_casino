import React from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { useHistory } from 'react-router-dom'

import { MessageUpdateMutation, MessageQuery } from 'admin/gql'
import { Loading } from 'mrooi'
import { useToasts } from 'common/hooks'

import { MessageForm } from '../MessageForm'

interface MessageUpdateProps {
  match: {
    params: {
      id: string
    }
  }
}

export const MessageUpdate: React.FC<MessageUpdateProps> = ({ match }) => {
  const history = useHistory()
  const { toast } = useToasts()

  const onError = error => {
    toast.error(error.message)
  }

  const { id } = match.params

  const { data } = useQuery(MessageQuery, {
    variables: { id },
    onError,
    onCompleted: data => {
      if (!data.message) {
        toast.error('Could not find draft.')
        history.push('/messaging/mailbox')
        return
      }

      if (data.message.live) {
        toast.error('Sent messages cannot be edited.')
        history.push('/messaging/mailbox')
      }
    },
  })

  const [messageUpdate] = useMutation(MessageUpdateMutation, {
    onError,
  })

  const onSubmit = async (values, send) => {
    const result = await messageUpdate({
      variables: {
        data: {
          id: values.id,
          title: values.title,
          body: values.body,
          link: values.link,
          heroImage: values.heroImage,
          logoImage: values.logoImage,
          featuredImage: values.featuredImage,
          recipients: values.recipients,
        },
      },
    })

    if (result.errors) {
      return
    }

    if (send) {
      history.push(`/messaging/mailbox/${values.id}/send`)
      return
    }

    if (result.data?.messageUpdate?.id) {
      toast.success('Message updated.')
    }

    history.push('/messaging/mailbox')
  }

  if (!data?.message) {
    return <Loading />
  }

  return (
    <MessageForm
      title="Update Message"
      initialValues={data?.message ?? {}}
      onSubmit={onSubmit}
    />
  )
}
