import React from 'react'
import { useHistory } from 'react-router-dom'

import { useAxiosPost, useAxiosGet, useToasts } from 'common/hooks'
import { Loading } from 'mrooi'
import { type Raffle } from 'common/types'

import { RaffleForm } from './RaffleForm'

interface EditRaffleRouteProps {
  match: {
    params: {
      id: string
    }
  }
}

export const EditRaffleRoute: React.FC<EditRaffleRouteProps> = ({ match }) => {
  const history = useHistory()
  const { toast } = useToasts()
  const { id } = match.params

  const [{ data }, reloadRaffle] = useAxiosGet<{ raffle: Raffle }>(
    `/raffle/${id}`,
  )

  const [createRaffle] = useAxiosPost(`/raffle/${id}`, {
    method: 'patch',
    onCompleted: () => {
      toast.success('Raffle updated.')

      history.push('/crm/raffles')
    },
    onError: error => toast.error(error.message),
  })

  const onSubmit = React.useCallback(
    async values => {
      await createRaffle({ variables: values })
    },
    [createRaffle],
  )

  if (!data?.raffle) {
    return <Loading />
  }

  return (
    <RaffleForm
      edit={true}
      title="Edit Raffle"
      initialValues={data.raffle}
      onSubmit={onSubmit}
      reloadRaffle={reloadRaffle}
    />
  )
}
