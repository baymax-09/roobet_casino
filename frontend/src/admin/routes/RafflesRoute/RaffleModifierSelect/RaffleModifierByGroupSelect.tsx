import React from 'react'
import { useQuery } from '@apollo/client'

import { type RaffleModifierIdentifier } from 'common/types'
import { GameTagsNotCachedQuery } from 'admin/gql'
import { useToasts } from 'common/hooks'

import { RaffleModifierSelect } from './'

interface RaffleModifierByGroupSelectProps {
  initialValues: RaffleModifierIdentifier[]
  index: number
  setFieldValue: (fieldName: string, id: RaffleModifierIdentifier[]) => void
}

export const RaffleModifierByGroupSelect: React.FC<
  RaffleModifierByGroupSelectProps
> = ({ index, initialValues, setFieldValue }) => {
  const { toast } = useToasts()
  const { data, loading } = useQuery(GameTagsNotCachedQuery, {
    onError: error => {
      toast.error(error.message)
    },
  })

  if (loading || !data) {
    return null
  }

  const selectData = data.gameTagsNotCached.map(
    ({ slug, title, identifier }) => ({ id: slug, title, identifier }),
  )

  return (
    <RaffleModifierSelect
      index={index}
      setFieldValue={setFieldValue}
      initialValues={initialValues}
      data={selectData}
      label="Game Groups"
    />
  )
}
