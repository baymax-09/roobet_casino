import React from 'react'
import { Dialog } from '@mui/material'
import { useQuery } from '@apollo/client'

import { AdminTPGameQuery, type AdminTPGameData } from 'admin/gql'
import { withRulesAccessController } from 'admin/components'
import { type TPGameQueryVariables } from 'app/gql'
import { Loading } from 'mrooi'

import { TPGamesEditForm } from './TPGamesEditForm'

interface TPGameEditDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  gameIdentifier: string
  onUpdateCompleted: () => void
}

const UpdateTPEditDialog = withRulesAccessController(['tpgames:update'], Dialog)

export const TPGameEditDialog: React.FC<TPGameEditDialogProps> = React.memo(
  ({ open, setOpen, gameIdentifier, onUpdateCompleted }) => {
    const {
      data: game,
      loading,
      refetch,
    } = useQuery<AdminTPGameData, TPGameQueryVariables>(AdminTPGameQuery, {
      variables: {
        gameIdentifier,
      },
    })

    const modifiedGame = React.useMemo(() => {
      if (!game || !game.tpGameAdmin) return null

      const modifiedGame = { ...game.tpGameAdmin }

      return modifiedGame
    }, [game])

    return (
      <UpdateTPEditDialog
        maxWidth="md"
        fullWidth
        fullScreen={false}
        open={open}
      >
        {loading && <Loading />}
        {modifiedGame && (
          <TPGamesEditForm
            game={modifiedGame}
            reload={refetch}
            setOpen={setOpen}
            onUpdateCompleted={onUpdateCompleted}
          />
        )}
      </UpdateTPEditDialog>
    )
  },
)
