import React from 'react'
import { useHistory } from 'react-router-dom'
import { useQuery } from '@apollo/client'

import { useToasts } from 'common/hooks'
import { type SlotPotatoQueryResponse, SlotPotatoQuery } from 'admin/gql'
import { Loading } from 'mrooi'

import { SlotPotatoForm } from './SlotPotatoForm'

interface SlotPotatoUpdateRouteProps {
  match: {
    params: {
      id: string
    }
  }
}

export const EditSlotPotatoRoute: React.FC<SlotPotatoUpdateRouteProps> = ({
  match,
}) => {
  const history = useHistory()
  const { toast } = useToasts()
  const { id } = match.params
  const { data, loading } = useQuery<SlotPotatoQueryResponse>(SlotPotatoQuery, {
    variables: { id },
    onError: error => {
      console.error(error.message)
      toast.error('Error loading slot potato')
    },
    skip: !id,
  })
  const onSubmit = () => {
    history.push('/crm/slot-potato')
  }

  const initialValues = data?.slotPotatoes[0]

  if (loading) {
    return <Loading />
  } else {
    return (
      <SlotPotatoForm
        isEdit={true}
        slotPotatoFormValues={initialValues}
        onCompleted={onSubmit}
      />
    )
  }
}
