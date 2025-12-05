import React, { useMemo } from 'react'
import { Form, Formik } from 'formik'
import { Button, TextField, Paper, MenuItem } from '@mui/material'
import Typography from '@mui/material/Typography'
import MUIDataTable from 'mui-datatables'
import { useQuery, useMutation } from '@apollo/client'

import { sortBy } from 'common/util'
import { type BlockedGamesChunk, TPGameBlockedFields } from 'common/types'
import {
  TPGamesBlocksQuery,
  EnableTPGameMutation,
  BlockTPGameMutation,
  type BlockedGamesQueryData,
  type EnableGameMutationData,
  type BlockGameMutationData,
} from 'admin/gql'
import { useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'
import { useAccessControl } from 'admin/hooks'
import { helperTextErrorHelper } from 'admin/util/form'

import { useTPGameBlocksRouteStyles } from './TPGameBlocksRoute.styles'

const ReadGameDisableDatatable = withRulesAccessController(
  ['tpgame_disables:read'],
  MUIDataTable,
)
const CreateGameDisableFormik = withRulesAccessController(
  ['tpgame_disables:create'],
  Formik,
)

export const TPGameBlocksRoute: React.FC = () => {
  const classes = useTPGameBlocksRouteStyles()
  const { toast } = useToasts()
  const { hasAccess: hasTPGameDeleteAccess } = useAccessControl([
    'tpgame_disables:delete',
  ])

  const { data } = useQuery<BlockedGamesQueryData>(TPGamesBlocksQuery, {
    onError: _ => {
      toast.error('Error loading Disabled Games')
    },
  })

  const [enableTPGameMutationFn] = useMutation<EnableGameMutationData>(
    EnableTPGameMutation,
    {
      update(cache, { data }) {
        const newTPBlockGames = data?.enableTPGameMutation
        cache.writeQuery({
          query: TPGamesBlocksQuery,
          data: {
            tpGameBlocks: newTPBlockGames,
          },
        })
      },
      onError: _ => {
        toast.error('Error enabling games')
      },
    },
  )

  const [blockTPGameMutationFn] = useMutation<BlockGameMutationData>(
    BlockTPGameMutation,
    {
      update(cache, { data }) {
        const newTPBlockGames = data?.blockTPGameMutation
        cache.writeQuery({
          query: TPGamesBlocksQuery,
          data: {
            tpGameBlocks: newTPBlockGames,
          },
        })
      },
    },
  )

  const columns = ['Key', 'Value']

  const _sortAndSetDisabledGames = (
    disabledGames: BlockedGamesChunk[] = [],
  ) => {
    return [...disabledGames].sort(sortBy('key'))
  }

  const disabledGames = useMemo(() => {
    if (data) {
      return _sortAndSetDisabledGames(data.tpGameBlocks)
    }
    return []
  }, [data])

  const rows = disabledGames
    ? disabledGames.map(disabledGame => ({
        Key: disabledGame.key,
        Value: disabledGame.value,
      }))
    : []

  const _handleDisableClick = async values => {
    const { key, value } = values
    if (!key || !value) {
      toast.error('Must have Key and Value before Disable')
      return
    }

    const results = await blockTPGameMutationFn({
      variables: { data: { key, value } },
    })
    if (results.errors) {
      toast.error('Unable to disable game')
      return
    }
    toast.success('Successfully disabled game')
  }

  return (
    <div className={classes.root}>
      <div className={classes.pageContainer}>
        <ReadGameDisableDatatable
          title="Active Disables"
          data={rows}
          columns={columns}
          options={{
            caseSensitive: true,
            download: false,
            print: false,
            selectableRows: hasTPGameDeleteAccess ? 'single' : 'none',
            onRowsDelete: row => {
              enableTPGameMutationFn({
                variables: {
                  id: disabledGames[row.data[0].dataIndex].id,
                },
                onCompleted: () => {
                  toast.success('Successfully enabled game')
                },
                onError: () => {
                  toast.error('Unable to enable game')
                },
              })
            },
          }}
        />
        <CreateGameDisableFormik
          initialValues={{
            key: '',
            value: '',
          }}
          onSubmit={_handleDisableClick}
        >
          {({ values, errors, handleChange }) => (
            <Paper elevation={4} className={classes.formContainer}>
              <Typography variant="h6">New Disable</Typography>
              <Form className={classes.form}>
                <TextField
                  variant="standard"
                  select
                  fullWidth
                  name="key"
                  value={values.key}
                  error={!!errors.key}
                  helperText={helperTextErrorHelper(errors.key)}
                  onChange={handleChange}
                  label="Key"
                >
                  {TPGameBlockedFields.map(blockedKey => (
                    <MenuItem key={blockedKey} value={blockedKey}>
                      {blockedKey}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  variant="standard"
                  fullWidth
                  name="value"
                  value={values.value}
                  error={!!errors.value}
                  helperText={helperTextErrorHelper(errors.value)}
                  onChange={handleChange}
                  label="Value"
                />
                <Button type="submit" variant="contained" color="primary">
                  Update
                </Button>
              </Form>
            </Paper>
          )}
        </CreateGameDisableFormik>
      </div>
    </div>
  )
}
