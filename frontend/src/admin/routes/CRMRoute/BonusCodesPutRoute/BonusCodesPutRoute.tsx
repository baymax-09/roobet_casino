import React from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { useHistory } from 'react-router-dom'

import {
  BonusCodeUpdateMutation,
  BonusCodesGetAllQuery,
  BonusCodesGetByIdQuery,
  BonusCodeCreateMutation,
} from 'admin/gql'
import { useToasts } from 'common/hooks'
import {
  BonusCodeTypeValues,
  type BonusCode,
  type BonusCodeSubmitErrors,
  type BonusCodeUpdateMutationResults,
  type BonusCodeByIdQueryResults,
  type BonusCodeCreateMutationResults,
  type BonusCodeGetAllQueryResults,
} from 'admin/types'
import { Loading } from 'mrooi'

import { BonusCodeTemplateForm } from './BonusCodeTemplate'

interface BonusCodesUpdateRouteProps {
  match: {
    params: {
      id: string
    }
  }
}

const INITIAL_VALUES = {
  name: '',
  description: '',
  type: BonusCodeTypeValues[0],
  typeSettings: {
    amount: 0,
    rounds: 0,
    gameIdentifier: '',
    tpGameAggregator: 'softswiss',
  },
}

export const BonusCodesPutRoute: React.FC<BonusCodesUpdateRouteProps> = ({
  match,
}) => {
  const history = useHistory()
  const { toast } = useToasts()

  const { id } = match.params

  const { data, loading } = useQuery<BonusCodeByIdQueryResults>(
    BonusCodesGetByIdQuery,
    {
      variables: { id },
      onError: error => {
        toast.error(error.message)
      },
      skip: !id,
    },
  )

  const currentBonusCode = data?.bonusCodeById ?? INITIAL_VALUES

  const [bonusCodeCreateMutation] = useMutation<BonusCodeCreateMutationResults>(
    BonusCodeCreateMutation,
    {
      update(cache, { data }) {
        const newBonusCode = data?.bonusCodeCreate
        const existingBonusCodes = cache.readQuery<BonusCodeGetAllQueryResults>(
          {
            query: BonusCodesGetAllQuery,
          },
        )
        cache.writeQuery({
          query: BonusCodesGetAllQuery,
          data: {
            bonusCodes: [
              ...(existingBonusCodes?.bonusCodes ?? []),
              newBonusCode,
            ],
          },
        })
      },
      onCompleted: () => {
        toast.success('Successfully created bonus code')
        history.push('/crm/bonus-codes')
      },
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  const [bonusCodeUpdateMutation] = useMutation<BonusCodeUpdateMutationResults>(
    BonusCodeUpdateMutation,
    {
      update(cache, { data }) {
        const updatedBonusCode = data?.bonusCodeUpdate
        const existingBonusCodes = cache.readQuery<BonusCodeGetAllQueryResults>(
          {
            query: BonusCodesGetAllQuery,
          },
        )

        const mappedBonusCodes = existingBonusCodes?.bonusCodes
          ? existingBonusCodes.bonusCodes.map(bonusCode => {
              if (bonusCode.id === updatedBonusCode?.id) {
                return updatedBonusCode
              }
              return bonusCode
            })
          : [updatedBonusCode]
        cache.writeQuery({
          query: BonusCodesGetAllQuery,
          data: {
            bonusCodes: mappedBonusCodes,
          },
        })
      },
      onCompleted: () => {
        toast.success('Successfully created bonus code')
        history.push('/crm/bonus-codes')
      },
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  const onSubmit = async (values: BonusCode, { setErrors }) => {
    const { id, name, description, type, typeSettings } = values

    const errors: BonusCodeSubmitErrors = {}

    if (!name) {
      errors.name = 'Must specify a name'
    }

    if (!description) {
      errors.description = 'Must specify a description'
    }

    if (!type) {
      errors.type = 'Must specify a type'
    }

    if (type === 'FREESPINS') {
      if (!typeSettings.amount) {
        errors.amount = 'Must specify an amount'
      }
      if (!typeSettings.rounds) {
        errors.rounds = 'Must specify rounds'
      }
      if (!typeSettings.gameIdentifier) {
        errors.gameIdentifier = 'Must specify game identifier'
      }
      if (!typeSettings.tpGameAggregator) {
        errors.tpGameAggregator = 'Must specify A tp game aggregator'
      }
    }
    if (Object.keys(errors).length > 0) {
      return setErrors(errors)
    }

    const { __typename, ...updateFields } = typeSettings

    if (id) {
      return await bonusCodeUpdateMutation({
        variables: {
          data: {
            id,
            name,
            description,
            type,
            typeSettings: { ...updateFields },
          },
        },
      })
    }
    return await bonusCodeCreateMutation({
      variables: {
        data: {
          name,
          description,
          type,
          typeSettings,
        },
      },
    })
  }

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <BonusCodeTemplateForm
          title={`${id ? 'Update' : 'Create'} Bonus Code`}
          initialValues={currentBonusCode}
          onSubmit={onSubmit}
        />
      )}
    </>
  )
}
