import React, { useState } from 'react'
import { Formik, Form, type FormikConfig } from 'formik'
import {
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material'

import { useUser, useAxiosGet, useToasts, useAxiosPost } from 'common/hooks'
import { api, isApiError } from 'common/util'
import { withRulesAccessController } from 'admin/components'
import { useAccessControl } from 'admin/hooks'

import { useControlStyles } from '../Control.styles'

import { useETHRouteStyles } from './ETHRoute.styles'

const DepositETHFormikAccess = withRulesAccessController<
  FormikConfig<ProcessTransactionVariables>
>(['deposits:update'], Formik)

interface ProcessTransactionVariables {
  id: string
  smartContract?: true
  forcedReprocess?: boolean
}

type ProcessTransactionResult =
  | {
      success: false
      error: string
    }
  | {
      success: true
      internal: true
      depositId: string
      userId: string
    }
  | {
      success: true
      internal: false
      depositId: string
      credited: boolean
      confirmations: number
      userId: string
    }

interface GetCurrentBlockData {
  smartContract?: number
  erc20?: number
  regular?: number
}

export const EthRoute: React.FC = () => {
  const classes = useETHRouteStyles()
  const blockClasses = useControlStyles()
  const { toast } = useToasts()
  const user = useUser()
  const { hasAccess: hasWithdrawalAccess } = useAccessControl([
    'withdrawals:update',
  ])
  const { hasAccess: hasForcedReprocessAccess } = useAccessControl([
    'deposits:dangerously_update',
  ])

  const [loading, setLoading] = useState(false)

  const [{ data: currentBlockNumber }, refetch] =
    useAxiosGet<GetCurrentBlockData>('/admin/getCurrentBlock?crypto=Ethereum', {
      onError: error => toast.error(error.response.data),
    })

  // GROSS! Delete me one day.
  React.useEffect(() => {
    const interval = setInterval(refetch, 12000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const [processTransactionId, { loading: processTxLoading }] = useAxiosPost<
    ProcessTransactionResult[],
    ProcessTransactionVariables
  >('/ethereum/transaction/process', {
    onCompleted: data => {
      if (data.length === 0) {
        toast.error(
          'Deposit is already completed or failed to find any possible deposits for specified transaction.',
        )
        return
      }

      for (const result of data) {
        if (!result.success) {
          toast.error(result.error)
          continue
        }

        if (result.internal) {
          toast.success(
            `Processed internal transaction. Created pending deposit record ${result.depositId} for user ${result.userId}. The deposit should be confirmed momentarily.`,
          )
          continue
        }

        if (!result.credited) {
          toast.error(
            `Failed to process transaction. The transaction only has ${result.confirmations} confirmations.`,
          )
          continue
        }

        toast.success(
          `Processed transaction. Completed deposit ${result.depositId} for ${result.userId}.`,
        )
      }
    },
    onError: error => {
      const message =
        'message' in error ? error.message : 'An unknown error occurred.'

      toast.error(message)
    },
  })

  const onSubmitProcess = React.useCallback(
    (values: ProcessTransactionVariables) => {
      processTransactionId({
        variables: values,
      })
    },
    [processTransactionId],
  )

  const onSubmitBump = async (values, { setErrors }) => {
    const { gasPrice, transactionHash, forcedReprocess } = values
    setLoading(true)
    try {
      const response = await api.post<any, { success: boolean; error: string }>(
        '/ethereum/transaction/boost',
        {
          gasPrice,
          transactionHash,
          forcedReprocess,
        },
      )
      if (response?.success) {
        toast.success('Successfully Bumped!')
      } else {
        toast.error(response?.error)
      }
    } catch (error) {
      // @ts-expect-error need a typeguard for Axios interceptor errors
      toast.error(error.response.data)
    } finally {
      setLoading(false)
    }
  }

  const onSubmitReset = async ({ transactionId }) => {
    setLoading(true)
    try {
      const response = await api.post<
        { transactionId: string },
        { success: boolean; error?: string }
      >('/ethereum/transaction/reset', {
        transactionId,
      })
      if (response.success) {
        toast.success('Successfully Reset!')
      } else {
        if (response?.error) {
          toast.error(response.error)
        } else {
          toast.error('An unknown error occurred.')
        }
      }
    } catch (error: any) {
      if (isApiError(error)) {
        toast.error(error.response.data)
      } else {
        toast.error('An unknown error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={classes.root}>
      <Typography variant="h3">ETH Controls</Typography>

      <div className={blockClasses.currentBlockContainer}>
        <Typography className={blockClasses.currentBlockText}>
          Processing block for Regular/ERC20 Transactions:
        </Typography>
        <Typography
          className={blockClasses.currentBlockNumber}
          variant="h3"
          color="textPrimary"
        >
          {currentBlockNumber?.regular ?? '000000'}
        </Typography>
      </div>

      <DepositETHFormikAccess
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
          </div>
        )}
      </DepositETHFormikAccess>

      <div className={blockClasses.currentBlockContainer}>
        <Typography className={blockClasses.currentBlockText}>
          Processing block for Smart Contract Transactions:
        </Typography>
        <Typography
          className={blockClasses.currentBlockNumber}
          variant="h3"
          color="textPrimary"
        >
          {currentBlockNumber?.smartContract ?? '000000'}
        </Typography>
      </div>

      <DepositETHFormikAccess
        onSubmit={onSubmitProcess}
        initialValues={{
          id: '',
          smartContract: true,
        }}
      >
        {({ values, errors, handleChange }) => (
          <div className={blockClasses.controlForm}>
            <Typography variant="h5" paragraph>
              Re-Process Smart Contract Transaction
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
      </DepositETHFormikAccess>

      {(hasWithdrawalAccess || user.department === 'Dev') && (
        <Formik
          initialValues={{
            transactionHash: '0x0',
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
                  label="Gas Price (in Gwei)"
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

      {hasWithdrawalAccess && (
        <Formik
          initialValues={{
            transactionId: '',
          }}
          onSubmit={onSubmitReset}
        >
          {({ values, errors, handleChange }) => (
            <div className={blockClasses.controlForm}>
              <Typography variant="h5" paragraph>
                Reset Withdrawal
              </Typography>
              <Form>
                <TextField
                  variant="standard"
                  name="transactionId"
                  type="string"
                  value={values.transactionId}
                  error={!!errors.transactionId}
                  helperText={errors.transactionId}
                  onChange={handleChange}
                  label="Transaction ID"
                />

                <Button
                  disabled={loading}
                  type="submit"
                  color="primary"
                  variant="contained"
                  className={classes.submitButton}
                >
                  Reset
                </Button>
              </Form>
            </div>
          )}
        </Formik>
      )}
    </div>
  )
}
