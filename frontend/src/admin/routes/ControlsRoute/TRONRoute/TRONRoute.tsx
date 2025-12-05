import React from 'react'
import { Formik, Form, type FormikConfig } from 'formik'
import { Button, TextField, Typography } from '@mui/material'

import { useAxiosGet, useAxiosPost, useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'

import { StakingForm } from './StakingForm'
import { useControlStyles } from '../Control.styles'

import { useTRONRouteStyles } from './TRONRoute.styles'

const DepositTRONFormikAccess = withRulesAccessController<
  FormikConfig<{ id: string }>
>(['deposits:update'], Formik)

export const TronRoute: React.FC = () => {
  const classes = useTRONRouteStyles()
  const blockClasses = useControlStyles()
  const { toast } = useToasts()

  const [{ data: currentBlockNumber }, refetch] = useAxiosGet<number>(
    '/admin/getCurrentBlock?crypto=Tron',
    {
      onError: error => toast.error(error.response.data),
    },
  )

  // GROSS! Delete me one day.
  React.useEffect(() => {
    const interval = setInterval(refetch, 12000)
    return () => {
      clearInterval(interval)
    }
  }, [refetch])

  const [processTransactionId, { loading: processTxLoading }] = useAxiosPost<
    { success: boolean },
    { id: string; network: 'Tron' }
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
          network: 'Tron',
        },
      })
    },
    [processTransactionId],
  )

  return (
    <div className={classes.root}>
      <Typography variant="h3">TRON Controls</Typography>

      <div className={blockClasses.currentBlockContainer}>
        <Typography className={blockClasses.currentBlockText}>
          Processing Block for TRON Transactions:
        </Typography>
        <Typography
          className={blockClasses.currentBlockNumber}
          variant="h3"
          color="textPrimary"
        >
          {currentBlockNumber ?? '000000'}
        </Typography>
      </div>

      <DepositTRONFormikAccess
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
      </DepositTRONFormikAccess>

      <StakingForm />
    </div>
  )
}
