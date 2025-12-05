import React from 'react'
import { useHistory } from 'react-router-dom'

import { useAxiosGet, useAxiosPost, useToasts } from 'common/hooks'
import { type KOTH } from 'common/types'
import { Loading } from 'mrooi'
import { type MatchParams } from 'common/types/matchParams'

import { KOTHForm } from './KOTHForm'

export const EditKOTHRoute: React.FC<MatchParams> = ({ match }) => {
  const history = useHistory()
  const { toast } = useToasts()
  const { id } = match.params

  const [{ data }] = useAxiosGet<KOTH>(`/admin/koth/${id}`)

  const [updateKOTH] = useAxiosPost(`/admin/koth/${id}`, {
    method: 'patch',
    onCompleted: () => {
      toast.success('KOTH updated!')

      history.push('/crm/koths')
    },
    onError: error => toast.error(error.message),
  })

  const onSubmit = React.useCallback(
    async values => {
      await updateKOTH({ variables: values })
    },
    [updateKOTH],
  )
  if (!data) {
    return <Loading />
  }
  return (
    <KOTHForm create={false} initialValues={data} onFormSubmit={onSubmit} />
  )
}
