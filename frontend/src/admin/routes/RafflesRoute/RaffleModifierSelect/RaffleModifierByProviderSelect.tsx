import React from 'react'
import { useQuery } from '@apollo/client'

import { type RaffleModifierIdentifier } from 'common/types'
import { TPGamesProviderNames, type TPGamesProviderNamesData } from 'admin/gql'
import { useToasts } from 'common/hooks'

import { RaffleModifierSelect } from '.'

interface RaffleModifierByProviderSelectProps {
  index: number
  initialValues: RaffleModifierIdentifier[]
  setFieldValue: (fieldName: string, id: RaffleModifierIdentifier[]) => void
}

export const RaffleModifierByProviderSelect: React.FC<
  RaffleModifierByProviderSelectProps
> = ({ index, initialValues, setFieldValue }) => {
  const { toast } = useToasts()
  const { data, loading } = useQuery<TPGamesProviderNamesData>(
    TPGamesProviderNames,
    {
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  if (loading || !data) {
    return null
  }

  const selectData = data.tpGamesProviderNames.map(providerName => ({
    id: providerName,
    title: providerName,
  }))

  return (
    <RaffleModifierSelect
      index={index}
      setFieldValue={setFieldValue}
      initialValues={initialValues}
      data={selectData}
      label="Game Providers"
    />
  )
}
