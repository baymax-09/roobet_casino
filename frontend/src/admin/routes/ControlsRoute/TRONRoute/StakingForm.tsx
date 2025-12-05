import React, { useState } from 'react'
import { Formik, Form, type FormikConfig } from 'formik'
import {
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  Link,
  type SelectChangeEvent,
} from '@mui/material'

import { useAxiosGet, useAxiosPost, useToasts, useConfirm } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'

import { useControlStyles } from '../Control.styles'

import { useTRONRouteStyles } from './TRONRoute.styles'

type Mode = 'freeze' | 'unfreeze'
type Resource = 'BANDWIDTH' | 'ENERGY'

interface UnFrozen {
  unfreeze_amount: number
  unfreeze_expire_time: number
}

interface ResourceInfo {
  energyAmount: number
  bandwidthAmount: number
  unFrozen?: UnFrozen[]
  netLimit: number
  energyLimit: number
}

type ProcessStakeResult =
  | {
      success: true
      error: null
      data: {
        frozen: number
        unFrozen: number
      }
    }
  | {
      success: false
      error: string
      data: undefined
    }

const StakingFormikAccess = withRulesAccessController<
  FormikConfig<{ amount: number }>
>(['crypto_staking:update'], Formik)

export const StakingForm: React.FC = props => {
  const classes = useTRONRouteStyles()
  const blockClasses = useControlStyles()
  const { toast } = useToasts()
  const confirm = useConfirm()
  const [mode, setMode] = useState<Mode>('freeze')
  const [resource, setResource] = useState<Resource>('BANDWIDTH')

  const [{ data: accountResource }, refetchResource] =
    useAxiosGet<ResourceInfo>('/tron/account/resource', {
      onError: error => toast.error(error.response.data),
    })

  const [processStake, { loading: processStakeLoading }] = useAxiosPost<
    ProcessStakeResult,
    { amount: number; mode: string; resource: string }
  >('/tron/transaction/stake', {
    onCompleted: data => {
      if (data.success) {
        toast.success('transaction has been processed successfully')
        refetchResource()
      } else {
        toast.error(data.error)
      }
    },
    onError: error => {
      const message =
        'message' in error ? error.message : 'An unknown error occurred.'

      toast.error(message)
    },
  })

  const onSubmitStake = React.useCallback(
    async (values: { amount: number }) => {
      try {
        await confirm({
          title: `Confirm ${mode}`,
          message: `${values.amount} trx is going to ${mode}`,
        })
      } catch {
        return
      }

      processStake({
        variables: {
          amount: values.amount * 1000000, // should be converted trx amount to sun amount
          mode,
          resource,
        },
      })
    },
    [processStake, confirm, mode, resource],
  )

  const handleChangeMode = (event: SelectChangeEvent<string>) => {
    if (event.target.value === 'freeze' || event.target.value === 'unfreeze') {
      setMode(event.target.value)
    }
  }

  const handleChangeResource = (event: SelectChangeEvent<string>) => {
    if (event.target.value === 'BANDWIDTH' || event.target.value === 'ENERGY') {
      setResource(event.target.value)
    }
  }

  return (
    <>
      <Typography className={blockClasses.currentBlockText}>
        Stake TRX Management
      </Typography>

      <div className={blockClasses.currentBlockContainer}>
        <Typography className={blockClasses.currentBlockText}>
          Selected Wallet:
        </Typography>
        <Typography
          className={blockClasses.currentBlockNumber}
          variant="h3"
          color="textPrimary"
        >
          <Link href="https://tronscan.org/#/address/TRYtrEkTFiZbuuzt7o7ac7TVeEC5PLsnQa">
            TRYtrEkTFiZbuuzt7o7ac7TVeEC5PLsnQa
          </Link>
        </Typography>
      </div>

      <StakingFormikAccess
        initialValues={{
          amount: 0,
        }}
        onSubmit={onSubmitStake}
      >
        {({ values, errors, handleChange }) => (
          <div className={blockClasses.controlForm}>
            <div className={classes.stakeType}>
              <div>
                <InputLabel>Freeze / Unfreeze</InputLabel>

                <Select
                  defaultValue="freeze"
                  value={mode}
                  onChange={handleChangeMode}
                >
                  <MenuItem key="Freeze" value="freeze">
                    Freeze
                  </MenuItem>
                  <MenuItem key="Unfreeze" value="unfreeze">
                    Unfreeze
                  </MenuItem>
                </Select>
              </div>
              <div>
                <InputLabel>Resource Type</InputLabel>

                <Select
                  variant="standard"
                  defaultValue="BANDWIDTH"
                  value={resource}
                  onChange={handleChangeResource}
                >
                  <MenuItem key="bandwidth" value="BANDWIDTH">
                    BANDWIDTH
                  </MenuItem>
                  <MenuItem key="energy" value="ENERGY">
                    ENERGY
                  </MenuItem>
                </Select>
              </div>
            </div>
            <Form>
              <TextField
                variant="standard"
                name="amount"
                type="number"
                value={values.amount}
                error={!!errors.amount}
                onChange={handleChange}
                label={mode + ' amount (trx)'}
              />

              <Button
                disabled={processStakeLoading || values.amount <= 0}
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
      </StakingFormikAccess>

      <div>
        <Typography className={blockClasses.currentBlockText}>
          {`Frozen amount for Bandwidth : ${accountResource?.bandwidthAmount}`}
        </Typography>

        <Typography className={blockClasses.currentBlockText}>
          {`Frozen amount for Energy : ${accountResource?.energyAmount}`}
        </Typography>

        <Typography className={blockClasses.currentBlockText}>
          {`bandwidth amount from staking: ${accountResource?.netLimit}`}
        </Typography>

        <Typography className={blockClasses.currentBlockText}>
          {`energy amount from staking: ${accountResource?.energyLimit}`}
        </Typography>

        <Typography className={blockClasses.currentBlockText}>
          Unfreezing balances
        </Typography>

        {accountResource?.unFrozen?.map(item => (
          <div className={classes.unfreezeItem}>
            <Typography className={blockClasses.currentBlockText}>
              {item.unfreeze_amount}
            </Typography>
            <Typography className={blockClasses.currentBlockText}>
              {new Date(item.unfreeze_expire_time).toDateString()}
            </Typography>
          </div>
        ))}
      </div>
    </>
  )
}
