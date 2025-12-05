import React from 'react'
import { useHistory } from 'react-router-dom'

import { useAxiosPost, useToasts } from 'common/hooks'

import { RaffleForm } from './RaffleForm'

export const CreateRaffleRoute: React.FC = () => {
  const history = useHistory()
  const { toast } = useToasts()

  const [createRaffle] = useAxiosPost('/raffle', {
    onCompleted: () => {
      toast.success('Raffle created.')

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

  return (
    <RaffleForm
      edit={false}
      title="Create Raffle"
      initialValues={{}}
      onSubmit={onSubmit}
    />
  )
}
