import React from 'react'
import { Dialog, Button, Typography } from '@mui/material'
import { useMutation, useQuery } from '@apollo/client'

import { type TPGame } from 'common/types'
import { TPGamesGetAllQuery, TPGameCategoryUpdate } from 'admin/gql'
import { useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'

import { AddRemoveGamesFromCategory } from './AddRemoveGamesFromCategory'

import { useListGameCategoriesDialogStyles } from './TPGameCategoriesDialog.styles'

interface TPGameCategory {
  name: string
  games: TPGame[]
}

interface TPGameCategoriesDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  category: TPGameCategory
  onUpdateCompleted: () => void
}

const UpdateTPCategoryDialog = withRulesAccessController(
  ['tpgames:update'],
  Dialog,
)

export const TPGameCategoriesDialog: React.FC<TPGameCategoriesDialogProps> =
  React.memo(({ open, setOpen, category, onUpdateCompleted }) => {
    const classes = useListGameCategoriesDialogStyles()
    const { toast } = useToasts()
    const [categorizedGames, setCategorizedGames] = React.useState(
      category.games ?? [],
    )
    const initialGamesRef = React.useRef(category.games ?? [])

    const { data: gameResponse } = useQuery(TPGamesGetAllQuery, {
      variables: {
        approvalStatus: 'approved',
        disabledGames: false,
      },
      onError: error => {
        toast.error(error.message)
      },
    })
    const tpGames = gameResponse?.tpGamesGetAll ?? []

    const [updateCategoryForGames] = useMutation(TPGameCategoryUpdate, {
      onCompleted: () => {
        toast.success(`Updated games in ${category.name}.`)
        onUpdateCompleted()
      },
      onError: error => {
        toast.error(error.message)
      },
    })

    const handleClose = () => {
      setOpen(false)
    }

    const handleSave = () => {
      const addedGames = categorizedGames.filter(
        game => !initialGamesRef.current.includes(game),
      )
      const removedGames = initialGamesRef.current.filter(
        game => !categorizedGames.includes(game),
      )
      updateCategoryForGames({
        variables: {
          input: {
            addedGames,
            removedGames,
            category: category.name,
          },
        },
      })
    }

    return (
      <UpdateTPCategoryDialog
        maxWidth="xs"
        fullWidth
        fullScreen={false}
        open={open}
        onClose={handleClose}
      >
        <div className={classes.Dialog__categoryTitle}>
          <Typography variant="h4">
            {`Editing Category '${category.name}'`}
          </Typography>
        </div>
        <AddRemoveGamesFromCategory
          gamesInCategory={categorizedGames}
          allTpGames={tpGames}
          onGameListUpdate={games => setCategorizedGames(games)}
        />
        <div className={classes.Button__actions}>
          <Button
            onClick={handleClose}
            className={classes.Button__addMargin}
            variant="contained"
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className={classes.Button__addMargin}
            variant="contained"
            color="primary"
          >
            Save
          </Button>
        </div>
      </UpdateTPCategoryDialog>
    )
  })
