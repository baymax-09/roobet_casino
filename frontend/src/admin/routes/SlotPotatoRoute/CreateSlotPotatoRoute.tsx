import React from 'react'
import { useHistory } from 'react-router-dom'

import { SlotPotatoForm } from './SlotPotatoForm'

export const CreateSlotPotatoRoute: React.FC = () => {
  const history = useHistory()
  const onSubmit = () => {
    history.push('/crm/slot-potato')
  }
  return <SlotPotatoForm isEdit={false} onCompleted={onSubmit} />
}
