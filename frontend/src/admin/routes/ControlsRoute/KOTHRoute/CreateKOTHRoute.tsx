import React from 'react'
import { useHistory } from 'react-router-dom'

import { useAxiosPost, useToasts } from 'common/hooks'
import { type CreateKOTHRequest } from 'common/types'

import { KOTHForm } from './KOTHForm'

export const CreateKOTHRoute: React.FC = () => {
  const history = useHistory()
  const { toast } = useToasts()

  const [createKOTH] = useAxiosPost<null, CreateKOTHRequest>('/admin/koth', {
    onCompleted: () => {
      toast.success('KOTH created.')

      history.push('/crm/koths')
    },
    onError: error => toast.error(error.message),
  })
  const initialCreateValues: CreateKOTHRequest = {
    startTime: new Date().toDateString(),
    endTime: new Date().toDateString(),
    whichRoo: 'astro',
    minBet: 5,
  }

  const onSubmit = React.useCallback(
    async (values: CreateKOTHRequest) => {
      await createKOTH({ variables: values })
    },
    [createKOTH],
  )
  return (
    <KOTHForm
      create={true}
      initialValues={initialCreateValues}
      onFormSubmit={onSubmit}
    />
  )
}
