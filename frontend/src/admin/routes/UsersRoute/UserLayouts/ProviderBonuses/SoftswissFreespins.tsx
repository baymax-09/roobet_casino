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

type Bonuses = NonNullable<UserData['softswissFreespins']>

interface SoftswissFreespinsProps {
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
  revokeBonus: (issueId: string) => void,
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

        return item.games.join(', ')
      },
    },
  },
  {
    name: 'betLevel',
    label: 'Bet Level',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return item.bet_level
      },
    },
  },
  {
    name: 'rounds',
    label: 'Rounds',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return item.freespins_quantity
      },
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
    },
  },
  {
    name: 'expires',
    label: 'Expires',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return moment(item.valid_until).format('lll Z')
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
          <RevokeBonusButton onClick={() => revokeBonus(item._id)}>
            Revoke
          </RevokeBonusButton>
        )
      },
    },
  },
]

export const SoftswissFreespins: React.FC<SoftswissFreespinsProps> = ({
  userId,
  bonuses,
  reload,
}) => {
  const confirm = useConfirm()
  const { toast } = useToasts()

  const classes = useProviderBonusesStyles()

  const revokeBonus = React.useCallback(
    async (issueId: string) => {
      try {
        await confirm({
          title: 'Cancel Freespins',
          message: 'Are you sure you want to cancel these freespins?',
        })
      } catch {
        // Confirm modal was canceled.
        return
      }

      try {
        await api.post('/softswiss/cancelFreespins', {
          issue_id: issueId,
        })

        toast.success('Freespins revoked.')
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to revoke freespins.'

        toast.error(message)
      } finally {
        reload()
      }
    },
    [confirm, toast, reload],
  )

  const addBonus = async () => {
    try {
      const params = await confirm<{ reason: string }>({
        title: 'Add Softswiss Freespins',
        message: 'Use the wizard below to configure freespins',
        inputs: [
          {
            type: 'text',
            key: 'gameId',
            name: 'GameID (ex: softswiss:SpinAndSpell)',
            helperText:
              'bgaming, netent, quickspin, relax, thunderkick, infin, epicmedia, nolimit, elk, yggdrasil, pushgaming',
          },
          {
            type: 'number',
            key: 'betLevel',
            name: 'Bet Level',
            defaultValue: 0,
            helperText: 'Min 1 (1 Would be the least $ they can bet per spin)',
          },
          {
            type: 'number',
            key: 'rounds',
            name: 'Number of Rounds',
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
        const reason = await handleReasons(params)

        if (reason) {
          params.reason = reason
        } else {
          toast.error(
            'Reason must be specified. If you selected other, please add a specific reason.',
          )
          return
        }

        await api.post('/softswiss/createFreespins', {
          ...params,
          userId,
        })

        toast.success('Freespins created.')
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to issue freespins.'

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
        <Typography variant="h4">Softswiss</Typography>
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
