import React from 'react'
import { Form, Formik, type FormikProps } from 'formik'
import {
  Button,
  FormLabel,
  TextField,
  Select,
  InputLabel,
  Paper,
  Chip,
  Stack,
} from '@mui/material'
import { useMutation, useQuery } from '@apollo/client'

import { prettyPrintSize } from 'common/util'
import {
  type TPGameApprovalStatus,
  TP_GAMES_SQUARE_IMAGE,
  TP_GAME_APPROVAL_STATUS,
} from 'admin/constants'
import { useToasts } from 'common/hooks'
import { DateTimePicker, ImagePreviewUpload } from 'mrooi'
import {
  type UpdateTPGameResponse,
  TPGameUpdate,
  TPGameMetadataQuery,
} from 'admin/gql'
import { withRulesAccessController } from 'admin/components'
import { type TPGame } from 'common/types'

import { GameTagSelectChip } from '../GameTagsRoute/GameTagSelectChip'
import { AutoCompleteGameToCategory } from './AutocompleteGameToCategory'

import { useTPGamesEditRouteStyles } from './TPGamesEditRoute.styles'

const { maxSize, width, height } = TP_GAMES_SQUARE_IMAGE

interface TPGameUpdateInput {
  gameIdentifier: string
  input: {
    releasedAt: string
    approvalStatus: TPGameApprovalStatus
    tags?: string[]
    title?: string
    squareImage?: string
    description?: string
    provider?: string
    payout?: number
    category?: string
  }
}

interface EditGameFormProps {
  game: TPGame
  reload: () => void
  setOpen: (open: boolean) => void
  onUpdateCompleted: () => void
}

const EditTPGameFormik = withRulesAccessController(['tpgames:update'], Formik)

export const TPGamesEditForm: React.FC<EditGameFormProps> = ({
  game,
  reload,
  setOpen,
  onUpdateCompleted,
}) => {
  const classes = useTPGamesEditRouteStyles()
  const { toast } = useToasts()
  const formRef = React.useRef<FormikProps<object>>(null)

  const [updateTPGameMutation] = useMutation<
    UpdateTPGameResponse,
    TPGameUpdateInput
  >(TPGameUpdate)

  const [tags, setTags] = React.useState<string[]>(game.tagIds ?? [])

  const handleTagsChange = (tags: string[]) => {
    setTags(tags)
    formRef.current?.setFieldValue('tags', tags)
  }

  const { data: TPGameMetadata } = useQuery(TPGameMetadataQuery, {
    onError: error => {
      toast.error(error.message)
    },
  })

  const { tpGameMetadata } = TPGameMetadata || {}
  const { categories } = tpGameMetadata || {}
  const categoryNames = categories || []

  const handleClose = () => {
    setOpen(false)
  }

  const resetForm = () => {
    if (formRef.current) {
      formRef.current.setValues(game)
    }
  }

  const onSubmit = async values => {
    const { errors } = await updateTPGameMutation({
      variables: {
        gameIdentifier: game.identifier,
        input: {
          approvalStatus: values.approvalStatus,
          releasedAt: new Date(values.releasedAt).toString(),
          tags: values.tags,
          title: values.title,
          squareImage: values.squareImage,
          description: values.description,
          provider: values.provider,
          payout: values.payout,
          category: values.category,
        },
      },
    })

    toast.success(
      'The game has been updated. It may take some time for the changes to reflect on the site.',
    )
    reload()

    if (errors?.length) {
      toast.error(`The game failed to updated: ${errors[0].message}`)
    }
    onUpdateCompleted()
  }

  React.useEffect(resetForm, [game])

  return (
    <Paper elevation={4} className={classes.GameEditRoute__formContainer}>
      <EditTPGameFormik
        innerRef={formRef}
        initialValues={game}
        onSubmit={onSubmit}
      >
        {({ values, errors, setValues, handleChange }) => (
          <Form className={classes.form}>
            <TextField
              variant="standard"
              fullWidth
              required
              disabled
              name="identifier"
              value={values.identifier}
              error={!!errors.identifier}
              helperText={(errors.identifier as string) || undefined}
              onChange={handleChange}
              label="Identifier"
            />
            <TextField
              variant="standard"
              fullWidth
              required
              name="title"
              value={values.title}
              error={!!errors.title}
              helperText={(errors.title as string) || undefined}
              onChange={handleChange}
              label="Title"
            />
            <TextField
              variant="standard"
              fullWidth
              required
              name="payout"
              value={values.payout ?? 0}
              error={!!errors.payout}
              helperText={(errors.payout as unknown as number) || undefined}
              onChange={handleChange}
              label="RTP"
            />
            <GameTagSelectChip
              selectedTags={tags}
              onTagsChange={handleTagsChange}
            />
            <AutoCompleteGameToCategory
              categoryNames={categoryNames}
              currentCategory={values.category}
              onCategoryChange={(newCategory: string) =>
                setValues(values => ({ ...values, category: newCategory }))
              }
            />
            <TextField
              variant="standard"
              fullWidth
              name="description"
              value={values.description}
              error={!!errors.description}
              helperText={(errors.description as string) || undefined}
              onChange={handleChange}
              label="Description"
            />
            <TextField
              variant="standard"
              fullWidth
              required
              name="provider"
              value={values.provider}
              error={!!errors.provider}
              helperText={(errors.provider as string) || undefined}
              onChange={handleChange}
              label="Provider"
            />
            <DateTimePicker
              label="Released On"
              helperText={(errors.releasedAt as string) || undefined}
              value={values.releasedAt}
              onChange={date =>
                setValues(values => ({ ...values, releasedAt: date }))
              }
            />
            <InputLabel htmlFor="approvalStatus">Approval Status</InputLabel>
            <Select
              variant="standard"
              id="approvalStatus"
              className={classes.statusSelect}
              native
              name="approvalStatus"
              value={values.approvalStatus}
              onChange={handleChange}
            >
              {TP_GAME_APPROVAL_STATUS.map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            <div className={classes.imageUploadContainer}>
              <FormLabel>
                Square Image ({width}x{height}; ≤ {prettyPrintSize(maxSize)})
              </FormLabel>
              <div className={classes.imageUpload}>
                <ImagePreviewUpload
                  height={height}
                  id="squareImage"
                  identifier={game?.identifier}
                  maxSize={maxSize}
                  setUrl={url =>
                    setValues(values => ({ ...values, squareImage: url }))
                  }
                  url={values.squareImage}
                  width={width}
                />
              </div>
            </div>
            <div className={classes.blocklist}>
              <InputLabel htmlFor="blocklist">Country Blocklist</InputLabel>
              <div className={classes.blockList_container}>
                <Stack
                  direction="row"
                  spacing={1}
                  className={classes.Stack__Blocklist}
                >
                  {game.blacklist.map((country, index) => (
                    <Chip
                      key={index}
                      size="small"
                      label={country}
                      color="primary"
                      variant="filled"
                      disabled={true}
                      className={classes.Chip__Color}
                    />
                  ))}
                </Stack>
              </div>
            </div>
            <div className={classes.Dialog__footer}>
              <Button
                onClick={handleClose}
                variant="contained"
                color="primary"
                className={classes.Button__addMargin}
              >
                Cancel/Close
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                className={classes.Button__addMargin}
              >
                Save
              </Button>
            </div>
          </Form>
        )}
      </EditTPGameFormik>
    </Paper>
  )
}
