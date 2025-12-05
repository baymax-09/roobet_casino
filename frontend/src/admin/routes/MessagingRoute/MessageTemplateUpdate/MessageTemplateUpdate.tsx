import React from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { useHistory } from 'react-router-dom'

import { MessageTemplateUpdateMutation, MessageTemplateQuery } from 'admin/gql'
import { Loading } from 'mrooi'
import { useToasts } from 'common/hooks'

import { MessageTemplateForm } from '../MessageTemplateForm'

interface MessageTemplateProps {
  match: {
    params: {
      id: string
    }
  }
}

export const MessageTemplateUpdate: React.FC<MessageTemplateProps> = ({
  match,
}) => {
  const history = useHistory()
  const { toast } = useToasts()

  const onError = error => {
    toast.error(error.message)
  }

  const { id } = match.params

  const { data } = useQuery(MessageTemplateQuery, {
    variables: { id },
    onError,
    onCompleted: data => {
      if (!data.messageTemplate) {
        toast.error('Could not find message template.')
        history.push('/messaging/templates')
      }
    },
  })

  const [messageTemplateUpdate] = useMutation(MessageTemplateUpdateMutation, {
    onError,
  })

  const onSubmit = async values => {
    const result = await messageTemplateUpdate({
      variables: {
        data: {
          id: values.id,
          name: values.name,
          heroImage: values.heroImage,
          title: values.title,
          body: values.body,
        },
      },
    })

    if (result.errors) {
      return
    }

    if (result.data?.messageTemplateUpdate?.id) {
      toast.success('Message template updated.')
    }

    history.push('/messaging/templates')
  }

  if (!data?.messageTemplate) {
    return <Loading />
  }

  return (
    <MessageTemplateForm
      title="Update Message Template"
      initialValues={data?.messageTemplate ?? {}}
      onSubmit={onSubmit}
    />
  )
}
