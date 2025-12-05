import React from 'react'
import { Button, Dialog, Typography } from '@mui/material'
import { useMutation } from '@apollo/client'

import { useToasts } from 'common/hooks'
import { TPGameCategoryUpdate } from 'admin/gql'
import { withRulesAccessController } from 'admin/components'

import { AutoCompleteGameToCategory } from './AutocompleteGameToCategory'

import { useTPUpdateGamesCategoriesRouteStyles } from './TPUpdateGamesCategoriesDialog.styles'

interface TPGameCategoriesDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  gamesToUpdate: string[]
  onUpdateCompleted: () => void
  existingCategories: string[]
}

const TPGamesCategoriesDialog = withRulesAccessController(
  ['tpgames:update'],
  Dialog,
)

export const TPUpdateGameCategoriesDialog: React.FC<TPGameCategoriesDialogProps> =
  React.memo(
    ({
      open,
      setOpen,
      gamesToUpdate,
      onUpdateCompleted,
      existingCategories,
    }) => {
      const { toast } = useToasts()
      const classes = useTPUpdateGamesCategoriesRouteStyles()
      const [updatedCategory, setUpdatedCategory] = React.useState('')
      const handleClose = () => {
        setOpen(false)
      }

      const [updateCategoryForGames] = useMutation(TPGameCategoryUpdate, {
        onCompleted: () => {
          toast.success(`Updated selected games to new category.`)
        },
        onError: error => {
          toast.error(error.message)
        },
      })

      const onSubmit = newCategory => {
        if (newCategory.length > 0) {
          updateCategoryForGames({
            variables: {
              input: {
                addedGames: gamesToUpdate,
                removedGames: [],
                category: newCategory,
              },
            },
          }).then(() => {
            onUpdateCompleted()
            handleClose()
          })
        } else {
          toast.error('Please add a category')
        }
      }

      return (
        <TPGamesCategoriesDialog
          maxWidth="xs"
          fullWidth
          fullScreen={false}
          open={open}
        >
          <div className={classes.Dialog}>
            <div className={classes.Dialog__categoryTitle}>
              <Typography variant="h4">
                {`Editing Category For ${gamesToUpdate.length} games.`}
              </Typography>
            </div>
            <AutoCompleteGameToCategory
              categoryNames={existingCategories}
              onCategoryChange={(newCategory: string) => {
                setUpdatedCategory(newCategory)
              }}
            />
            <div className={classes.Dialog__footer}>
              <Button
                onClick={handleClose}
                variant="contained"
                color="primary"
                className={classes.Button__addMargin}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                className={classes.Button__addMargin}
                onClick={() => onSubmit(updatedCategory)}
              >
                Save
              </Button>
            </div>
          </div>
        </TPGamesCategoriesDialog>
      )
    },
  )
