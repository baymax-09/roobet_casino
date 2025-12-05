import React from 'react'
import { Form, Formik } from 'formik'
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

import { useAxiosGet, useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'
import { useAccessControl } from 'admin/hooks'
import { helperTextErrorHelper } from 'admin/util/form'

import { useControlStyles } from '../Control.styles'

import { useLTCRouteStyles } from './LTCRoute.styles'

const DepositLTCFormikAccess = withRulesAccessController(
  ['deposits:update'],
  Formik,
)

export const LTCRoute: React.FC = () => {
  const classes = useLTCRouteStyles()
  const blockClasses = useControlStyles()
  const { toast } = useToasts()
  const { hasAccess: hasForcedReprocessAccess } = useAccessControl([
    'deposits:dangerously_update',
  ])

  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'ltcBlockPopover',
  })

  const [{ data: currentBlockNumber, loading: blockLoading }] = useAxiosGet<{
    height: number
  }>('/admin/getCurrentBlock?crypto=Litecoin', {
    onError: error => toast.error(error.response.data),
  })
  const [{ loading }, reprocess] = useAxiosGet<
    {
      success: boolean
      error?: string
    },
    {
      transactionId: string
      crypto: string
      forcedReprocess: boolean
    }
  >('/blockio/admin/depositUpdate', {
    lazy: true,
    onCompleted: () => {
      toast.success('Added to queue!')
    },
    onError: error => {
      toast.error(error.response.data)
    },
  })

  const reProcessTransaction = values => {
    const { hash, forcedReprocess } = values
    reprocess({ transactionId: hash, crypto: 'ltc', forcedReprocess })
  }

  const popoverMessage =
    'Remember, do NOT reprocess a transaction if our workers are delayed. They will eventually catch up to the latest block.'
  const blockNumber =
    !blockLoading && currentBlockNumber?.height
      ? currentBlockNumber.height
      : '000000'

  return (
    <div className={classes.root}>
      <Typography variant="h3">LTC Controls</Typography>

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

      <DepositLTCFormikAccess
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
              name="hash"
              onChange={handleChange}
              type="text"
              label="Hash"
              value={values.hash}
              error={!!errors.hash}
              helperText={helperTextErrorHelper(errors.hash)}
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
      </DepositLTCFormikAccess>
    </div>
  )
}
