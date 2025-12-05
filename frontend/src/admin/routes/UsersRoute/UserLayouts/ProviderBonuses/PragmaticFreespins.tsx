import React from 'react'
import { Typography, Button } from '@mui/material'
import moment from 'moment'

import { DataTable } from 'mrooi'
import { useConfirm, useToasts } from 'common/hooks'
import { api } from 'common/util'
import { withRulesAccessController } from 'admin/components'

import { type UserData } from '../../types'
import { handleReasons, providerFreespinReasons } from './freespinReasons'
import { buildSelectOptions } from '../OverviewViewTypes/balanceChanges'

import { useProviderBonusesStyles } from './ProviderBonuses.styles'

type Bonuses = NonNullable<UserData['pragmaticFreespins']>

interface PragmaticFreespinsProps {
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
  bonuses: Bonuses['bonuses'],
  revokeBonus: (bonusCode: string) => void,
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

        return item.gameIDList
      },
    },
  },
  {
    name: 'rounds',
    label: 'Rounds',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return `${item.roundsPlayed} / ${item.rounds}`
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

        return moment(item.expirationDate).format('lll Z')
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
          item.rounds !== item.roundsPlayed && (
            <RevokeBonusButton onClick={() => revokeBonus(item.bonusCode)}>
              Revoke
            </RevokeBonusButton>
          )
        )
      },
    },
  },
]

const pragmaticFeatures = [
  { key: 'R', value: 'Freespins' },
  { key: 'F', value: 'Bonus Buy' },
]

export const PragmaticFreespins: React.FC<PragmaticFreespinsProps> = ({
  userId,
  bonuses,
  reload,
}) => {
  const confirm = useConfirm()
  const { toast } = useToasts()

  const classes = useProviderBonusesStyles()

  const revokeBonus = React.useCallback(
    async (bonusCode: string) => {
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
        await api.post('/pragmatic/internal/cancelFreespins', {
          bonusCode,
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
      const getGame = await confirm<{ gameId: string }>({
        title: 'Add Pragmatic Feature',
        message: 'Choose a game to add the feature to',
        inputs: [
          {
            type: 'text',
            key: 'gameId',
            name: 'GameID (ex: vswaysdogs)',
          },
        ],
      })

      try {
        const betScales = await api.get<any, number[]>(
          '/pragmatic/internal/getBetScalesForGame',
          {
            params: {
              gameId: getGame.gameId,
            },
          },
        )

        if (!betScales || betScales?.length === 0) {
          toast.error(
            'Error getting bet options for game. Check if gameId is correct.',
          )
          return
        }

        const params = await confirm<{
          betPerRound: string
          frType: string
          rounds: string
          periodOfTime: string
          reason: string
          other?: string | null
        }>({
          title: 'Add Pragmatic Feature',
          message: 'Use the wizard below to configure feature',
          inputs: [
            {
              type: 'select',
              key: 'betPerRound',
              name: 'Bet Per Round',
              defaultValue: betScales[0].toString(),
              options: betScales.map(num => {
                return { key: num.toString(), value: num.toString() }
              }),
            },
            {
              type: 'select',
              key: 'frType',
              name: 'Feature',
              defaultValue: pragmaticFeatures[0].key,
              options: pragmaticFeatures.map(val => {
                return { key: val.key, value: val.value }
              }),
            },
            {
              type: 'number',
              key: 'rounds',
              name: 'Number of Rounds',
              defaultValue: 0,
              helperText:
                'Do not use with period of time or Bonus Feature. Zero = Disabled.',
            },
            {
              type: 'number',
              key: 'periodOfTime',
              name: 'Period of Time (Seconds)',
              defaultValue: 0,
              helperText:
                'Do not use with rounds or Bonus Feature. Zero = Disabled.',
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

        const reason = await handleReasons(params)

        if (reason) {
          params.reason = reason
        } else {
          toast.error(
            'Reason must be specified. If you selected other, please add a specific reason.',
          )
          return
        }

        api.post('/pragmatic/internal/createFreespins', {
          ...params,
          userId,
          rounds: parseFloat(params.rounds),
          gameId: getGame.gameId,
        })

        toast.success('Freespins created.')
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to create freespins.'

        toast.error(message)
      }
    } catch {
      // Confirm modal was canceled.
    }
  }

  const columns = React.useMemo(
    () => getColumns(bonuses.bonuses, revokeBonus),
    [bonuses, revokeBonus],
  )

  return (
    <>
      <div className={classes.ProviderBonuses__title}>
        <Typography variant="h4">Pragmatic</Typography>
        <CreateBonusButton
          color="primary"
          variant="contained"
          onClick={addBonus}
        >
          Add
        </CreateBonusButton>
      </div>
      <DataTable
        hideToolbar
        title="Mailbox"
        columns={columns}
        data={bonuses.bonuses}
      />
    </>
  )
}
