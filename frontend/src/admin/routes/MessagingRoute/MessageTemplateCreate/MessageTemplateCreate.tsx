import React from 'react'
import { useMutation } from '@apollo/client'
import { useHistory } from 'react-router-dom'

import { MessageTemplateCreateMutation } from 'admin/gql'
import { useToasts } from 'common/hooks'

import { MessageTemplateForm } from '../MessageTemplateForm'

export const MessageTemplateCreate: React.FC = () => {
  const history = useHistory()
  const { toast } = useToasts()

  const [messageTemplateCreate] = useMutation(MessageTemplateCreateMutation, {
    onError: ({ message }) => {
      toast.error(message)
    },
  })

  const onSubmit = async values => {
    // By the time this gets called, we can be confident the values are all present.
    const result = await messageTemplateCreate({ variables: { data: values } })

    if (result.errors) {
      return
    }

    if (result.data?.messageTemplateCreate?.id) {
      toast.success('Message template created.')
    }

    history.push('/messaging/templates')
  }

  return (
    <MessageTemplateForm
      title="Create Message Template"
      initialValues={{}}
      onSubmit={onSubmit}
    />
  )
}
