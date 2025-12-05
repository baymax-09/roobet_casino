import React from 'react'
import numeral from 'numeral'
import { useForm } from 'react-hook-form'
import {
  Button,
  Typography,
  Grid,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'

import { api, createMoment } from 'common/util'
import { useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'

import { type UserData } from '../types'

import { useRoowardsStyles } from './Roowards.styles'

interface RoowardsRecharge {
  _id: string
  expiresAt: string
  totalClaims: number
  maxClaims: number
  expired: boolean
  amount: number
}

const RoowardsRechargeGridForm = withRulesAccessController(
  ['roowards_recharge:update'],
  Grid,
)
const RoowardsRechargeUpdateButton = withRulesAccessController(
  ['roowards_recharge:update'],
  Button,
)
const RoowardsRechargeText = withRulesAccessController(
  ['roowards_recharge:update'],
  Typography,
)

interface RoowardsProps {
  userData: UserData
}

const RoowardsView: React.FC<RoowardsProps> = ({ userData }) => {
  const { user, roowards } = userData
  const classes = useRoowardsStyles()
  const { toast } = useToasts()

  const [busy, setBusy] = React.useState(false)
  const [reload, setReload] = React.useState<RoowardsRecharge | null>(null)

  const { register, handleSubmit, errors, setValue } = useForm({
    defaultValues: {
      maxClaims: 1,
      currency: 'crypto',
      amount: undefined,
      expiresAt: undefined,
    },
  })

  const onSubmit = values => {
    setBusy(true)

    if (reload) {
      api
        .post<{ id: string }, unknown>('/admin/roowards/disableReload', {
          id: reload._id,
        })
        .then(() => {
          resetFields()
          setBusy(false)
        })
        .catch(err => {
          toast.error(err.message)
        })
        .finally(() => {
          setBusy(false)
        })
      return
    }

    api
      .post<any, { reload: RoowardsRecharge }>('/admin/roowards/enableReload', {
        ...values,
        userName: user.name,
        amount: parseFloat(values.amount),
        maxClaims: parseInt(values.maxClaims),
      })
      .then(
        ({ reload }) => {
          setBusy(false)
          setReload(reload)
        },
        err => {
          toast.error(err.message)
          setBusy(false)
        },
      )
  }

  const resetFields = () => {
    setReload(null)
    setValue('amount', '')
    setValue('expiresAt', createMoment().add(7, 'd').format('MM/DD/YYYY'))
  }

  React.useEffect(() => {
    register({ name: 'currency' }, { required: true })

    api
      .post<unknown, { reloads: RoowardsRecharge[] }>(
        '/admin/roowards/reloads',
        {
          filter: {
            userId: user.id,
          },
          sort: {},
        },
      )
      .then(({ reloads }) => {
        if (reloads.length > 0) {
          setReload(reloads[0])
          setValue('amount', reloads[0].amount)
          setValue('maxClaims', reloads[0].maxClaims)
          setValue(
            'expiresAt',
            createMoment(reloads[0].expiresAt).format('MM/DD/YYYY'),
          )
        } else {
          resetFields()
        }
      })
      .catch(err => {
        toast.error(err.message)
      })
      .finally(() => {
        setBusy(false)
      })
  }, [user.id])

  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        <Typography component="div" variant="h6" gutterBottom>
          Stats
        </Typography>

        <List className={classes.stats}>
          <ListItem divider>
            <ListItemText
              primary={numeral(roowards.dAmount || 0).format('$0,0.00')}
              secondary={`Daily (Last claimed ${
                roowards.dLastClaimed
                  ? createMoment(roowards.dLastClaimed).fromNow()
                  : 'never'
              })`}
            />
          </ListItem>
          <ListItem divider>
            <ListItemText
              primary={numeral(roowards.mAmount || 0).format('$0,0.00')}
              secondary={`Monthly (Last claimed ${
                roowards.mLastClaimed
                  ? createMoment(roowards.mLastClaimed).fromNow()
                  : 'never'
              })`}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={numeral(roowards.wAmount || 0).format('$0,0.00')}
              secondary={`Weekly (Last claimed ${
                roowards.wLastClaimed
                  ? createMoment(roowards.wLastClaimed).fromNow()
                  : 'never'
              })`}
            />
          </ListItem>
        </List>

        <RoowardsRechargeText variant="h6" gutterBottom>
          ReCharge
        </RoowardsRechargeText>
        <form onSubmit={handleSubmit(onSubmit)}>
          <RoowardsRechargeGridForm container spacing={2} direction="column">
            <Grid item xs={4} sm={12} md={6}>
              <TextField
                variant="standard"
                fullWidth
                name="amount"
                autoComplete="off"
                type="number"
                inputRef={register({ required: true })}
                error={!!errors.amount}
                helperText={
                  !!errors.amount &&
                  (errors.amount.message || 'Amount is required')
                }
                disabled={busy || !!reload}
                label="Amount"
                placeholder="Amount"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={4} sm={12} md={6}>
              <TextField
                variant="standard"
                fullWidth
                name="maxClaims"
                autoComplete="off"
                type="number"
                inputRef={register({ required: true })}
                error={!!errors.maxClaims}
                helperText={
                  !!errors.maxClaims &&
                  (errors.maxClaims.message || 'Claim amount is required')
                }
                disabled={busy || !!reload}
                label="Max Claims"
                placeholder="Max Claims"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            {!!reload && (
              <>
                <Grid item xs={4} sm={12} md={6}>
                  <TextField
                    variant="standard"
                    fullWidth
                    autoComplete="off"
                    disabled
                    label="Expires At"
                    value={reload.expiresAt}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                <Grid item xs={4} sm={12} md={6}>
                  <TextField
                    variant="standard"
                    fullWidth
                    autoComplete="off"
                    error={reload.expired}
                    helperText={reload.expired ? 'Expired' : null}
                    disabled
                    label="Claimed"
                    value={`${reload.totalClaims}/${reload.maxClaims}`}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              </>
            )}
          </RoowardsRechargeGridForm>
        </form>

        <div className={classes.actions}>
          {!reload && (
            <RoowardsRechargeUpdateButton
              disabled={busy}
              onClick={handleSubmit(onSubmit)}
              color="primary"
            >
              Enable Recharge
            </RoowardsRechargeUpdateButton>
          )}

          {!!reload && (
            <RoowardsRechargeUpdateButton
              disabled={busy}
              onClick={onSubmit}
              color="primary"
            >
              Disable Recharge
            </RoowardsRechargeUpdateButton>
          )}
        </div>
      </Paper>
    </div>
  )
}

export const Roowards = React.memo(RoowardsView)
