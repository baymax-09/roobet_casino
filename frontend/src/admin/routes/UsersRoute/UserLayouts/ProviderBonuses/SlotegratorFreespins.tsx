import React from 'react'
import { Button, Typography } from '@mui/material'
import moment from 'moment'

import { withRulesAccessController } from 'admin/components'
import { useConfirm, useToasts } from 'common/hooks'
import { api } from 'common/util'
import { DataTable } from 'mrooi'

import { type UserData } from '../../types'
import { buildSelectOptions } from '../OverviewViewTypes/balanceChanges'
import { handleReasons, providerFreespinReasons } from './freespinReasons'

import { useProviderBonusesStyles } from './ProviderBonuses.styles'

type Bonuses = NonNullable<UserData['slotegratorFreespins']>

interface SlotegratorFreespinsProps {
  userId: string
  bonuses: Bonuses
  reload: () => void
}

interface CreateFreespinProps {
  userId: string
  campaignName: string
  betLevel: string
  rounds: number
  reason: string
  gameId: string
}

interface FreespinApiResponse {
  success: boolean
  message?: string
  payload?: object
}

interface CancelFreespinProps {
  campaignName: string
}

interface FreespinConfigParams {
  campaignName: string
  betLevel: string
  rounds: number
  reason: string
  other?: string
}

interface BetLevels {
  bets: object[]
  denominations: string[]
  lines: number
}

const RevokeBonusButton = withRulesAccessController(
  ['freespins:delete'],
  Button,
)
const CreateBonusButton = withRulesAccessController(
  ['freespins:create'],
  Button,
)

const getColumns = (bonuses: Bonuses, revokeBonus: (_id) => void) => [
  {
    name: '_id',
    label: 'ID',
    options: {
      display: false,
    },
  },
  {
    name: 'campaignName',
    label: 'Title',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return item.campaignName
      },
    },
  },
  {
    name: 'gameIdentifier',
    label: 'gameIdentifier',
    options: {
      display: false,
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return item.gameIdentifier
      },
    },
  },
  {
    name: 'betLevel',
    label: 'Bet Level',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return item.betLevel
      },
    },
  },
  {
    name: 'rounds',
    label: 'Rounds',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return item.rounds
      },
    },
  },
  {
    name: 'roundsRemaining',
    label: 'Rounds Left',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return item.roundsRemaining
      },
    },
  },
  {
    name: 'expires',
    label: 'Expires',
    options: {
      customBodyRender: (_, { rowIndex }) => {
        const item = bonuses[rowIndex]

        return moment(item.expiry).format('lll Z')
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

export const SlotegratorFreespins: React.FC<SlotegratorFreespinsProps> = ({
  userId,
  bonuses,
  reload,
}) => {
  const confirm = useConfirm()
  const { toast } = useToasts()
  const classes = useProviderBonusesStyles()

  const revokeBonus = React.useCallback(
    async _id => {
      try {
        await confirm({
          title: 'Cancel Freespins',
          message: 'Are you sure you want to cancel these freespins?',
        })
      } catch {
        return
      }
      try {
        const apiResponse = await api.post<
          CancelFreespinProps,
          FreespinApiResponse
        >('slotegrator/gis/admin/freespins/cancel', {
          freespinObjectId: _id,
        })
        if (apiResponse.success) {
          toast.success('Freespins revoked.')
        }
        if (!apiResponse.success) {
          throw new Error(apiResponse.message)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (message.length > 0) {
          toast.error(message)
        }
      } finally {
        reload()
      }
    },
    [confirm, toast, reload],
  )

  const addFreespin = async () => {
    try {
      const game = await confirm<{ identifier: string }>({
        title: 'Add Slotegrator Freespins',
        message: 'Enter the game identifier.',
        inputs: [
          {
            type: 'text',
            key: 'identifier',
            name: 'Game Identifier',
          },
        ],
      })
      try {
        const betLevels = await api.post<{ gameIdentifier: string }, BetLevels>(
          '/slotegrator/gis/admin/freespins/betLevels',
          {
            gameIdentifier: game.identifier,
          },
        )
        if (!betLevels || !Object.keys(betLevels).includes('denominations')) {
          toast.error('No bet levels found for this game.')
          return
        }

        const params: FreespinConfigParams = await confirm({
          title: 'Add Slotegrator Freespins',
          message: 'Use the wizard below to configure freespins',
          inputs: [
            {
              type: 'text',
              key: 'gameIdentifier',
              name: 'Game Identifier',
              defaultValue: game.identifier,
            },
            {
              type: 'text',
              key: 'campaignName',
              name: 'Campaign Name',
              helperText: 'Freespin campaign name',
            },
            {
              type: 'select',
              key: 'betLevel',
              name: 'Bet Level',
              options: buildSelectOptions(
                betLevels.denominations.map(denom => denom),
              ),
              defaultValue: '1',
            },
            {
              type: 'number',
              key: 'rounds',
              name: 'Rounds',
              defaultValue: 0,
            },
            {
              type: 'select',
              key: 'reason',
              name: 'Reason',
              options: buildSelectOptions(providerFreespinReasons),
              defaultValue: '',
            },
            {
              type: 'text',
              key: 'other',
              name: 'Specified Reason (Other)',
              required: false,
            },
          ],
        })

        const other = await handleReasons(params)
        if (other) {
          params.reason = other
          delete params.other
        } else {
          toast.error(
            'Reason must be specified. If you selected other, please add a specific reason.',
          )
          return
        }
        const response = await api.post<
          CreateFreespinProps,
          FreespinApiResponse
        >('/slotegrator/gis/admin/freespins/create', {
          ...params,
          userId,
        })
        if (response.success) {
          toast.success('Freespins created.')
        }
        if (!response.success) {
          throw new Error(response.message)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : ''

        if (message.length > 0) {
          toast.error(message)
        }
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
        <Typography variant="h4">Slotegrator</Typography>
        <CreateBonusButton
          color="primary"
          variant="contained"
          onClick={addFreespin}
        >
          Add
        </CreateBonusButton>
      </div>
      <DataTable hideToolbar title="Mailbox" columns={columns} data={bonuses} />
    </>
  )
}
