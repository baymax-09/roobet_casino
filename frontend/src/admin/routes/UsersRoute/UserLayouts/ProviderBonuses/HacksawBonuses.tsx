import React from 'react'
import { Typography, Button } from '@mui/material'
import moment from 'moment'

import { DataTable } from 'mrooi'
import { useConfirm, useToasts } from 'common/hooks'
import { api } from 'common/util'
import { withRulesAccessController } from 'admin/components'

import { type UserData } from '../../types'
import { buildSelectOptions } from '../OverviewViewTypes/balanceChanges'
import { handleReasons, providerFreespinReasons } from './freespinReasons'

import { useProviderBonusesStyles } from './ProviderBonuses.styles'

type Bonuses = NonNullable<UserData['hacksawFreespins']>

interface HacksawBonusesProps {
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

const getColumns = (
  bonuses: Bonuses,
  revokeBonus: (externalOfferId: string) => void,
) => [
  {
    name: 'id',
    label: 'ID',
    options: {
      display: false,
    },
  },
  {
    name: 'title',
    label: 'Title',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return item.gameId
      },
    },
  },
  {
    name: 'rounds',
    label: 'Rounds',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return item.nbRounds
      },
    },
  },
  {
    name: 'created',
    label: 'Created',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return moment(item.createDate).format('lll Z')
      },
    },
  },
  {
    name: 'expires',
    label: 'Expires',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return moment(item.expiryDate).format('lll Z')
      },
    },
  },
  {
    name: 'actions',
    label: 'Actions',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return (
          <RevokeBonusButton onClick={() => revokeBonus(item.externalOfferId)}>
            Revoke
          </RevokeBonusButton>
        )
      },
    },
  },
]

export const HacksawBonuses: React.FC<HacksawBonusesProps> = ({
  userId,
  bonuses,
  reload,
}) => {
  const confirm = useConfirm()
  const { toast } = useToasts()

  const classes = useProviderBonusesStyles()

  const revokeBonus = React.useCallback(
    async (externalOfferId: string) => {
      try {
        await confirm({
          title: 'Cancel Freespins',
          message: 'Are you sure you want to cancel these freespins?',
        })
      } catch (err) {
        return
      }

      try {
        api.post('/hacksaw/internal/deleteBonus', {
          userId,
          externalOfferId,
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create bonuses.'

        toast.error(message)
      } finally {
        reload()
      }
    },
    [confirm, toast, reload, userId],
  )

  const addBonus = async () => {
    try {
      const params = await confirm<{
        gameId: string
        rounds: string
        amount: string
        date: string
        reason: string
        other?: string | null
      }>({
        title: 'Add Hacksaw Freespins',
        message: 'Use the wizard below to configure freespins',
        inputs: [
          {
            type: 'text',
            key: 'gameId',
            name: 'GameID (ex: 1004)',
          },
          {
            type: 'number',
            key: 'rounds',
            name: 'Number of Rounds',
            defaultValue: 1,
            helperText: 'how many rounds the freespin is',
          },
          {
            type: 'number',
            key: 'amount',
            name: 'Amount',
            defaultValue: 1,
            helperText: 'Value of the freespin',
          },
          {
            type: 'date',
            key: 'expiresAt',
            name: 'Expiration Date',
            required: false,
            defaultValue: null,
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
        const reason = await handleReasons(params)

        if (reason) {
          params.reason = reason
        } else {
          toast.error(
            'Reason must be specified. If you selected other, please add a specific reason.',
          )
          return
        }

        await api.post('/hacksaw/internal/bonus', {
          ...params,
          userId,
          rounds: parseFloat(params.rounds),
        })

        toast.success('Freespins created.')
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
        <Typography variant="h4">Hacksaw</Typography>
        <CreateBonusButton
          color="primary"
          variant="contained"
          onClick={addBonus}
        >
          Add
        </CreateBonusButton>
      </div>
      <DataTable hideToolbar title="Mailbox" columns={columns} data={bonuses} />
    </>
  )
}
