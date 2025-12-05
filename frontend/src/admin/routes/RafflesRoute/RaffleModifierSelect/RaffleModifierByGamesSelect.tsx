import React from 'react'
import { useQuery } from '@apollo/client'

import { type RaffleModifierIdentifier } from 'common/types'
import { TPGamesGetAllQuery } from 'admin/gql'
import { useToasts } from 'common/hooks'

import { RaffleModifierSelect } from './'

interface RaffleModifierByGamesSelectProps {
  index: number
  initialValues: RaffleModifierIdentifier[]
  setFieldValue: (fieldName: string, id: RaffleModifierIdentifier[]) => void
}

export const RaffleModifierByGamesSelect: React.FC<
  RaffleModifierByGamesSelectProps
> = ({ index, initialValues, setFieldValue }) => {
  const { toast } = useToasts()
  const { data, loading } = useQuery(TPGamesGetAllQuery, {
    variables: {
      approvalStatus: 'approved',
      disabledGames: false,
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  if (loading || !data) {
    return null
  }

  const selectData = data.tpGamesGetAll.map(({ title, identifier }) => ({
    id: identifier,
    title,
    identifier,
  }))

  return (
    <RaffleModifierSelect
      index={index}
      setFieldValue={setFieldValue}
      initialValues={initialValues}
      data={selectData}
      label="Games"
    />
  )
}
