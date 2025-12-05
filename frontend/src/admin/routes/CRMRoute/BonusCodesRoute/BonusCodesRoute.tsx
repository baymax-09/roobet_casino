import React, { useState } from 'react'
import MUIDataTable, {
  type MUIDataTableOptions,
  type MUIDataTableColumn,
} from 'mui-datatables'
import { Button } from '@mui/material'
import { useQuery, useMutation } from '@apollo/client'
import { useHistory } from 'react-router-dom'

import { useToasts } from 'common/hooks'
import { BonusCodesGetAllQuery, BonusCodeDeleteMutation } from 'admin/gql'
import { Loading, TitleContainer } from 'mrooi'
import {
  type BonusCodeDeleteMutationResults,
  type BonusCode,
  type BonusCodeGetAllQueryResults,
} from 'admin/types'
import { withRulesAccessController } from 'admin/components'
import { useAccessControl } from 'admin/hooks'

import { useBonusCodeStyles } from './BonusCodes.styles'

const ReadBonusCodeTable = withRulesAccessController(['crm:read'], MUIDataTable)
const UpdateBonusCodeButton = withRulesAccessController(['crm:update'], Button)
const DeleteeBonusCodeButton = withRulesAccessController(['crm:delete'], Button)

export const BonusCodesRoute: React.FC = () => {
  const classes = useBonusCodeStyles()
  const { toast } = useToasts()
  const history = useHistory()
  const { hasAccess: hasBonusCodeCreateAccess } = useAccessControl([
    'crm:create',
  ])

  const [bonusCodes, setBonusCodes] = useState<BonusCode[]>([])

  const { data, loading } = useQuery<BonusCodeGetAllQueryResults>(
    BonusCodesGetAllQuery,
    {
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  const [bonusCodeDeleteMutation] = useMutation<BonusCodeDeleteMutationResults>(
    BonusCodeDeleteMutation,
    {
      update(cache, { data }) {
        const deletedBonusCodeId = data?.bonusCodeDelete?.id
        const existingBonusCodes = cache.readQuery<BonusCodeGetAllQueryResults>(
          {
            query: BonusCodesGetAllQuery,
          },
        )

        const filteredBonusCodes = (
          existingBonusCodes?.bonusCodes ?? []
        ).filter(bonusCode => bonusCode?.id !== deletedBonusCodeId)

        cache.writeQuery({
          query: BonusCodesGetAllQuery,
          data: {
            bonusCodes: filteredBonusCodes,
          },
        })
      },
      onCompleted: () => {
        toast.success('Bonus Code has been deleted.')
      },
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  React.useEffect(() => {
    setBonusCodes(data?.bonusCodes ?? [])
  }, [data])

  const deleteBonusCode = async (row, setSelectedRows) => {
    await bonusCodeDeleteMutation({ variables: { data: { id: row.id } } })
    setSelectedRows([])
  }

  const columns = React.useMemo(
    (): MUIDataTableColumn[] => [
      {
        name: 'name',
        label: 'Name',
        options: {
          display: true,
        },
      },
      {
        name: 'type',
        label: 'Type',
        options: {
          display: true,
        },
      },
      {
        name: 'description',
        label: 'Description',
        options: {
          display: true,
        },
      },
    ],
    [],
  )

  const tableOptions: MUIDataTableOptions = {
    selectableRows: 'single',
    customToolbarSelect: (selectedRows, displayData, setSelectedRows) => {
      if (!displayData.length) {
        return null
      }
      const dataIndex = selectedRows.data[0].dataIndex
      const row = bonusCodes[dataIndex]
      return (
        <>
          <UpdateBonusCodeButton
            className={classes.BonusCodeRoute__editButton}
            color="primary"
            variant="contained"
            onClick={() => history.push(`/crm/bonus-codes/${row.id}/edit`)}
          >
            Edit
          </UpdateBonusCodeButton>
          <DeleteeBonusCodeButton
            className={classes.BonusCodeRoute__deleteButton}
            color="primary"
            variant="contained"
            onClick={() => deleteBonusCode(row, setSelectedRows)}
          >
            Delete
          </DeleteeBonusCodeButton>
        </>
      )
    },
  }

  return (
    <TitleContainer
      title="Bonus Codes"
      actions={() =>
        hasBonusCodeCreateAccess
          ? [
              {
                value: 'Create Bonus Code',
                onClick: () => history.push('/crm/bonus-codes/create'),
              },
            ]
          : []
      }
    >
      {loading ? (
        <Loading />
      ) : (
        <ReadBonusCodeTable
          title=""
          columns={columns}
          data={bonusCodes}
          options={tableOptions}
        />
      )}
    </TitleContainer>
  )
}
