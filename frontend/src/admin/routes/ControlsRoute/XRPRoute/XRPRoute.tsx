import React from 'react'
import { Formik, Form, type FormikConfig } from 'formik'
import { Button, TextField, Typography } from '@mui/material'

import { useUser, useAxiosGet, useAxiosPost, useToasts } from 'common/hooks'
import { useAccessControl } from 'admin/hooks'
import { withRulesAccessController } from 'admin/components'

import { useControlStyles } from '../Control.styles'

import { useXRPRouteStyles } from './XRPRoute.styles'

const DepositXRPFormikAccess = withRulesAccessController<
  FormikConfig<{ id: string }>
>(['deposits:update'], Formik)

export const XrpRoute: React.FC = () => {
  const classes = useXRPRouteStyles()
  const blockClasses = useControlStyles()
  const { toast } = useToasts()
  const user = useUser()
  const { hasAccess: hasWithdrawalAccess } = useAccessControl([
    'withdrawals:update',
  ])

  const [{ data: currentLedgerNumber }, refetch] = useAxiosGet<number>(
    '/admin/getCurrentBlock?crypto=Ripple',
    {
      onError: error => toast.error(error.response.data),
    },
  )

  const [submitBump, { loading }] = useAxiosPost('/ripple/transaction/boost', {
    onCompleted: () => {
      toast.success('Successfully Bumped!')
    },
    onError: (error: any) =>
      toast.error(error.response ? error.response.data : error.message),
  })

  // GROSS! Delete me one day.
  React.useEffect(() => {
    const interval = setInterval(refetch, 12000)
    return () => {
      clearInterval(interval)
    }
  }, [refetch])

  const onSubmitBump = values => {
    const { gasPrice, transactionHash, forcedReprocess } = values
    submitBump({ variables: { gasPrice, transactionHash, forcedReprocess } })
  }
  const [processTransactionId, { loading: processTxLoading }] = useAxiosPost<
    { success: boolean },
    { id: string; network: 'Ripple' }
  >('/deposit/transaction/process', {
    onCompleted: () => {
      toast.success('Transaction has been queued up to be reprocessed.')
    },
    onError: error => {
      const message =
        'message' in error ? error.message : 'An unknown error occurred.'

      toast.error(message)
    },
  })

  const onSubmitProcess = React.useCallback(
    (values: { id: string }) => {
      processTransactionId({
        variables: {
          id: values.id,
          network: 'Ripple',
        },
      })
    },
    [processTransactionId],
  )

  return (
    <div className={classes.root}>
      <Typography variant="h3">XRP Controls</Typography>

      <div className={blockClasses.currentBlockContainer}>
        <Typography className={blockClasses.currentBlockText}>
          Processing Ledger for Ripple Transactions:
        </Typography>
        <Typography
          className={blockClasses.currentBlockNumber}
          variant="h3"
          color="textPrimary"
        >
          {currentLedgerNumber ?? '000000'}
        </Typography>
      </div>

      <DepositXRPFormikAccess
        onSubmit={onSubmitProcess}
        initialValues={{
          id: '',
        }}
      >
        {({ values, errors, handleChange }) => (
          <div className={blockClasses.controlForm}>
            <Typography variant="h5" paragraph>
              Re-Process Transaction
            </Typography>
            <Form>
              <TextField
                variant="standard"
                name="id"
                type="string"
                value={values.id}
                error={!!errors.id}
                onChange={handleChange}
                label="Hash"
              />

              <Button
                disabled={processTxLoading}
                type="submit"
                color="primary"
                variant="contained"
                className={classes.submitButton}
              >
                Process
              </Button>
            </Form>
          </div>
        )}
      </DepositXRPFormikAccess>

      {(hasWithdrawalAccess || user.department === 'Dev') && (
        <Formik
          initialValues={{
            transactionHash: '',
            gasPrice: 0,
          }}
          onSubmit={onSubmitBump}
        >
          {({ values, errors, handleChange }) => (
            <div className={blockClasses.controlForm}>
              <Typography variant="h5" paragraph>
                Bump Withdrawal
              </Typography>
              <Form>
                <TextField
                  variant="standard"
                  name="transactionHash"
                  type="string"
                  value={values.transactionHash}
                  error={!!errors.transactionHash}
                  helperText={errors.transactionHash}
                  onChange={handleChange}
                  label="Transaction Hash"
                />
                <TextField
                  variant="standard"
                  name="gasPrice"
                  type="number"
                  value={values.gasPrice}
                  error={!!errors.gasPrice}
                  helperText={errors.gasPrice}
                  onChange={handleChange}
                  label="Gas Price (Drops)"
                />

                <Button
                  disabled={loading}
                  type="submit"
                  color="primary"
                  variant="contained"
                  className={classes.submitButton}
                >
                  Bump
                </Button>
              </Form>
            </div>
          )}
        </Formik>
      )}
    </div>
  )
}
