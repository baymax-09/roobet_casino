import React from 'react'
import { Button, Typography } from '@mui/material'
import ordinal from 'ordinal'
import { useMutation } from '@apollo/client'

import { type Winner, type Raffle } from 'common/types'
import { useConfirm, useToasts } from 'common/hooks'
import { Link, DataTable } from 'mrooi'
import { isObjectError } from 'admin/util/error'
import { RedrawRaffleWinner } from 'admin/gql'

import { useRaffleFormStyles } from './RaffleForm.styles'

interface RaffleWinnersProps {
  raffleId: string
  winners: Winner[]
  payouts?: string[]
  reloadRaffle?: () => void
}

const RaffleWinners: React.FC<RaffleWinnersProps> = ({
  raffleId,
  winners,
  payouts,
  reloadRaffle,
}) => {
  const confirm = useConfirm()
  const { toast } = useToasts()
  const classes = useRaffleFormStyles()

  const [redrawWinnerMutation, { error }] = useMutation<
    { redrawRaffleWinner: Raffle },
    { raffleId: string; userId: string }
  >(RedrawRaffleWinner)

  const redrawWinner = React.useCallback(
    async (userId: string) => {
      await confirm({
        title: 'Confirm Action',
        message: 'Are you sure you want to redraw this winner?',
      })

      await redrawWinnerMutation({ variables: { raffleId, userId } })

      toast.success('Winner re-drawn!')

      if (reloadRaffle) {
        reloadRaffle()
      }
    },
    [confirm, redrawWinnerMutation, raffleId, toast, reloadRaffle],
  )

  if (error) {
    toast.error(
      isObjectError(error) ? error.message : 'An unknown error occurred.',
    )
  }

  return (
    <DataTable
      className={classes.winners}
      data={winners}
      options={{
        viewColumns: false,
        pagination: false,
        customToolbar: () => null,
        textLabels: {
          body: {
            noMatch: 'Winners have not been drawn for this raffle.',
          },
        },
      }}
      columns={[
        {
          name: 'position',
          label: 'Position',
          options: {
            sort: false,
            filter: false,
            customBodyRender: (_, { rowIndex }) => {
              return (
                <Typography variant="body2" color="textPrimary">
                  {`${ordinal(rowIndex + 1)} Place`}
                </Typography>
              )
            },
          },
        },
        {
          name: 'username',
          label: 'Username',
          options: {
            sort: false,
            filter: false,
            customBodyRender: (_, { rowIndex }) => {
              return (
                <Link
                  urlOrPath={`/users?index=id&key=${winners[rowIndex].user.id}`}
                  target="_blank"
                >
                  <Typography variant="body2" color="textPrimary">
                    {winners[rowIndex].user.name}
                  </Typography>
                </Link>
              )
            },
          },
        },
        {
          name: 'payout',
          label: 'Payout',
          options: {
            sort: false,
            filter: false,
            customBodyRender: (_, { rowIndex }) => {
              return payouts?.[rowIndex]
            },
          },
        },
        {
          name: 'tickets',
          label: 'Ticket Count',
          options: {
            sort: false,
            filter: false,
            customBodyRender: (_, { rowIndex }) => {
              return (
                <Typography variant="body2" color="textPrimary">
                  {Math.floor(winners[rowIndex].tickets.tickets)}
                </Typography>
              )
            },
          },
        },
        {
          name: 'actions',
          label: 'Action',
          options: {
            sort: false,
            customBodyRender: (_, { rowIndex }) => {
              return (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => redrawWinner(winners[rowIndex].user.id)}
                >
                  Redraw
                </Button>
              )
            },
          },
        },
      ]}
    />
  )
}

export default RaffleWinners
