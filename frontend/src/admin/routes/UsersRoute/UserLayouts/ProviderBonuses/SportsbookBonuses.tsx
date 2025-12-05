import React from 'react'
import { Typography, Button } from '@mui/material'
import moment from 'moment'

import { DataTable } from 'mrooi'
import { useConfirm, useToasts } from 'common/hooks'
import { api } from 'common/util'
import {
  type SportsbookBonus,
  type SportsbookBonusTemplate,
} from 'common/types'
import { withRulesAccessController } from 'admin/components'

import { type UserData } from '../../types'
import { buildSelectOptions } from '../OverviewViewTypes/balanceChanges'
import { handleReasons, providerFreespinReasons } from './freespinReasons'

import { useProviderBonusesStyles } from './ProviderBonuses.styles'

type Bonuses = NonNullable<UserData['slotegratorBonuses']>

interface SportsbookBonusesProps {
  userId: string
  bonuses: Bonuses
  reload: () => void
}

const RevokeBonusButton = withRulesAccessController(
  ['freespins:delete'],
  Button,
)
const CreateBonusButton = withRulesAccessController(
  ['freespins:create'],
  Button,
)

const getColumns = (bonuses: Bonuses, revokeBonus: (id: string) => void) => [
  {
    name: 'id',
    label: 'ID',
    options: {
      display: false,
      filter: false,
    },
  },
  {
    name: 'title',
    label: 'Title',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return item.template?.title
      },
      filter: false,
    },
  },
  {
    name: 'amount',
    label: 'Amount',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return item.amount
      },
      filter: false,
    },
  },
  {
    name: 'status',
    label: 'Status',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return item.status
      },
      sort: false,
    },
  },
  {
    name: 'created',
    label: 'Created',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return moment(item.createdAt).format('lll Z')
      },
      filter: false,
    },
  },
  {
    name: 'expires',
    label: 'Expires',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return moment(item.activeTo).format('lll Z')
      },
      filter: false,
    },
  },
  {
    name: 'actions',
    label: 'Actions',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return (
          !item.activated && (
            <RevokeBonusButton onClick={() => revokeBonus(item._id)}>
              Revoke
            </RevokeBonusButton>
          )
        )
      },
      filter: false,
    },
  },
]

export const SportsbookBonuses: React.FC<SportsbookBonusesProps> = ({
  userId,
  bonuses,
  reload,
}) => {
  const confirm = useConfirm()
  const { toast } = useToasts()

  const classes = useProviderBonusesStyles()

  const revokeBonus = React.useCallback(
    async (id: string) => {
      try {
        await confirm({
          title: 'Revoke Bonus',
          message: 'Are you sure you want to revoke this bonus?',
        })
      } catch (err) {
        // Confirm modal was canceled.
        return
      }

      try {
        await api.delete(`/admin/slotegrator/bonus/${id}`)

        toast.success('Bonus revoked.')
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to revoke bonus.'

        toast.error(message)
      } finally {
        reload()
      }
    },
    [confirm, toast, reload],
  )

  const addBonus = async () => {
    const { templates } = await api.get<
      any,
      { templates: SportsbookBonusTemplate[] }
    >('/admin/slotegrator/bonus-templates')

    if (!templates || templates?.length === 0) {
      return toast.error('Error loading bonus templates.')
    }

    try {
      const result = await confirm<{
        bonusTemplateId: number
        amount: string
        reason: string
        other?: string | null
      }>({
        title: 'Add Sportsbook Bonuses',
        message: 'Use the wizard below to configure bonuses.',
        inputs: [
          {
            type: 'select',
            key: 'bonusTemplateId',
            name: 'Bonus Template',
            defaultValue: undefined,
            required: true,
            options: templates.map(({ id: key, title, bonus_type }) => {
              const bonusType = (() => {
                if (bonus_type === 1) {
                  return 'Freebet'
                }

                if (bonus_type === 2) {
                  return 'Comboboost'
                }

                return undefined
              })()

              const value = `${title}${bonusType ? ` (${bonusType})` : ''}`

              return { key, value }
            }),
          },
          {
            type: 'number',
            key: 'amount',
            name: 'Amount (for freebets)',
            defaultValue: 0,
          },
          {
            type: 'select',
            key: 'reason',
            name: 'Reason',
            options: buildSelectOptions(providerFreespinReasons),
          },
          {
            type: 'text',
            key: 'other',
            name: 'Specified Reason (Other)',
            required: false,
          },
        ],
      })

      try {
        const reason = await handleReasons(result)

        if (reason) {
          result.reason = reason
        } else {
          toast.error(
            'Reason must be specified. If you selected other, please add a specific reason.',
          )
          return
        }

        await api.post<any, { bonuses: SportsbookBonus[] }>(
          '/admin/slotegrator/bonus',
          {
            ...result,
            userId,
          },
        )

        toast.success('Bonus created.')
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to create bonuses.'

        toast.error(message)
      } finally {
        reload()
      }
    } catch {
      // Confirm modal was canceled.
    }
  }

  const columns = React.useMemo(
    () => getColumns(bonuses, revokeBonus),
    [bonuses, revokeBonus],
  )

  return (
    <>
      <div className={classes.ProviderBonuses__title}>
        <Typography variant="h4" component="span">
          Sportsbook
        </Typography>
        <CreateBonusButton
          color="primary"
          variant="contained"
          onClick={addBonus}
        >
          Add
        </CreateBonusButton>
      </div>
      <DataTable
        columns={columns}
        data={bonuses}
        options={{
          viewColumns: false,
          filter: true,
        }}
      />
    </>
  )
}
