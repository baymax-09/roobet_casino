import React from 'react'
import { Form, Formik } from 'formik'
import { useMutation, useQuery } from '@apollo/client'
import {
  Button,
  Checkbox,
  FormControlLabel,
  Popover,
  TextField,
  Typography,
} from '@mui/material'
import Info from '@mui/icons-material/InfoOutlined'
import {
  usePopupState,
  bindHover,
  bindPopover,
} from 'material-ui-popup-state/hooks'

import { useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'
import { useAccessControl } from 'admin/hooks'
import { type BlockioCurrentBlockQueryResult } from 'admin/types/blockio'
import {
  BlockioCurrentBlockQuery,
  BlockioUpdateTransactionMutation,
} from 'admin/gql/blockio'
import { helperTextErrorHelper } from 'admin/util/form'

import { useControlStyles } from '../Control.styles'

import { useDOGERouteStyles } from './DOGERoute.styles'

const DepositDogeFormikAccess = withRulesAccessController(
  ['deposits:update'],
  Formik,
)

const DOGERoute: React.FC = () => {
  const classes = useDOGERouteStyles()
  const blockClasses = useControlStyles()
  const { toast } = useToasts()
  const { hasAccess: hasForcedReprocessAccess } = useAccessControl([
    'deposits:dangerously_update',
  ])

  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'dogeBlockPopover',
  })

  const { data, loading } = useQuery<BlockioCurrentBlockQueryResult>(
    BlockioCurrentBlockQuery,
    {
      variables: { crypto: 'Dogecoin' },
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  const [dogeUpdateTransactionMutation] = useMutation(
    BlockioUpdateTransactionMutation,
    {
      onCompleted: () => {
        toast.success('Reprocessed Dogecoin transaction.')
      },
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  const reProcessTransaction = values => {
    const { transactionId, forcedReprocess } = values
    dogeUpdateTransactionMutation({
      variables: {
        data: {
          transactionId,
          crypto: 'doge',
          forcedReprocess: !!forcedReprocess,
        },
      },
    })
  }

  const popoverMessage =
    'Remember, do NOT reprocess a transaction if our workers are delayed. They will eventually catch up to the latest block.'
  const blockNumber =
    !loading && data?.blockioCurrentBlock?.height
      ? data.blockioCurrentBlock.height
      : '000000'

  return (
    <div className={classes.root}>
      <Typography variant="h3">DOGE Controls</Typography>

      <div className={blockClasses.currentBlockContainer}>
        <Typography className={blockClasses.currentBlockText}>
          Currently Processing Block:
        </Typography>

        <Typography
          className={blockClasses.currentBlockNumber}
          variant="h3"
          color="textPrimary"
        >
          {blockNumber}
        </Typography>
        <Info {...bindHover(popupState)} className={blockClasses.infoIcon} />
        <Popover
          {...bindPopover(popupState)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <Typography variant="body2" className={blockClasses.popoverText}>
            {popoverMessage}
          </Typography>
        </Popover>
      </div>

      <DepositDogeFormikAccess
        initialValues={{
          hash: '',
        }}
        onSubmit={reProcessTransaction}
      >
        {({ values, errors, handleChange }) => (
          <Form className={blockClasses.controlForm}>
            <Typography variant="h5" paragraph>
              Re-Process Transaction
            </Typography>

            <TextField
              variant="standard"
              name="transactionId"
              onChange={handleChange}
              type="text"
              label="Transaction Id"
              value={values.transactionId}
              error={!!errors.transactionId}
              helperText={helperTextErrorHelper(errors.transactionId)}
            />

            <Button
              disabled={loading}
              type="submit"
              color="primary"
              variant="contained"
              className={classes.submitButton}
            >
              Process
            </Button>
            {hasForcedReprocessAccess && (
              <div>
                <FormControlLabel
                  label="Force Reprocess"
                  control={
                    <Checkbox
                      name="forcedReprocess"
                      checked={values.forcedReprocess}
                      onChange={handleChange}
                      value={values.forcedReprocess}
                    />
                  }
                />
              </div>
            )}
          </Form>
        )}
      </DepositDogeFormikAccess>
    </div>
  )
}

export { DOGERoute }
