import React from 'react'
import numeral from 'numeral'
import {
  Button,
  Grid,
  TextField,
  Card,
  CardContent,
  CardActions,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Typography,
} from '@mui/material'
import { Formik, Field, Form } from 'formik' // Import Formik components

import { api, coerceDateToUTCString } from 'common/util'
import { useConfirm, useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'
import { DateTimePicker } from 'mrooi'
import {
  type DepositBonusSubmitErrors,
  type DepositBonusItem,
  DEPOSIT_BONUS_TYPES,
  DEPOSIT_BONUS_REASONS,
} from 'admin/types'
import { PERCENT_TYPE, FIXED_TYPE, OTHER_REASON } from 'common/types'

import { type UserData } from '../types'

import { useDepositBonusStyles } from './DepositBonus.styles'

interface DepositBonusProps {
  userData: UserData
  updateUserData: (callback: (userData: UserData) => void) => void
}

const CreateDepositBonusButton = withRulesAccessController(
  ['deposit_bonus:create'],
  Button,
)
const UpdateDepositBonusButton = withRulesAccessController(
  ['deposit_bonus:update'],
  Button,
)

export const DepositBonus: React.FC<DepositBonusProps> = ({
  userData,
  updateUserData,
}) => {
  const classes = useDepositBonusStyles()
  const { user } = userData

  const [matchPromo, setMatchPromo] = React.useState(
    userData.matchPromo || null,
  )
  const confirm = useConfirm()
  const { toast } = useToasts()

  const [expireBonus, setExpireBonus] = React.useState<boolean>(
    !!matchPromo?.expirationDate,
  )
  const [checkedWagerReq, setCheckedWagerReq] = React.useState<boolean>(
    !!matchPromo?.wagerRequirementMultiplier,
  )
  const [checkedMinDeposit, setCheckedMinDeposit] = React.useState<boolean>(
    !!matchPromo?.minDeposit,
  )

  React.useEffect(() => {
    setMatchPromo(userData.matchPromo || null)
  }, [userData.matchPromo])

  const onSubmit = values => {
    const bodyParams = {
      ...values,
      userId: user.id,
      expirationDate:
        values.expirationDate &&
        new Date(coerceDateToUTCString(values.expirationDate)),
    }

    api.put('/promo/admin/matchPromo', bodyParams).then(() => {
      const mp = {
        ...values,
        leftToWager: 0,
        canWithdraw: true,
      }

      setMatchPromo(mp)
      updateUserData(ud => {
        ud.matchPromo = mp
      })
    })
  }

  const disableDepositBonus = forfeit => {
    const reset = () => {
      setMatchPromo(null)
      setCheckedMinDeposit(false)
      setCheckedWagerReq(false)
      setExpireBonus(false)
      updateUserData(ud => {
        ud.matchPromo = null
      })
    }

    if (forfeit) {
      return confirm({
        title: 'Forfeit Deposit Bonus',
        message:
          'Are you sure you want to forfeit the deposit bonus? This will reset their balance to ZERO',
      })
        .then(() => {
          return api
            .post('/promo/admin/abortMatchPromoWithPenalty', {
              userId: user.id,
            })
            .then(() => {
              reset()
            })
        })
        .catch(err => {
          err && toast.error(err.response ? err.response.data : err.message)
        })
    }

    confirm({
      title: 'Deposit Bonus',
      message: 'Are you sure you want to end the deposit bonus?',
    })
      .then(() => {
        return api
          .post('/promo/admin/abortMatchPromoNoPenalty', {
            userId: user.id,
          })
          .then(() => {
            reset()
          })
      })
      .catch(err => {
        err && toast.error(err.response ? err.response.data : err.message)
      })
  }

  const validateDepositBonusForm = (values: DepositBonusItem) => {
    const {
      bonusType,
      reason,
      maxMatch,
      minDeposit,
      wagerRequirementMultiplier,
      expirationDate,
      percentMatch,
      fixedAmount,
      specifiedReason,
    } = values

    const errors: Partial<DepositBonusSubmitErrors> = {}

    if (!bonusType.length) {
      errors.bonusType = 'Must specify a bonus type'
    }

    if (!reason.length) {
      errors.reason = 'Must specify a reason'
    }

    if (reason === OTHER_REASON) {
      if (!specifiedReason) {
        errors.specifiedReason = 'Must specify a reason'
      }
      values.reason = `Other - ${specifiedReason}`
    }

    if (bonusType === PERCENT_TYPE) {
      if (!percentMatch) {
        errors.percentMatch = 'Percent Match must be provided'
      }

      if (!maxMatch) {
        errors.maxMatch = 'Max Match must be provided'
      }
    }

    if (bonusType === FIXED_TYPE) {
      if (!fixedAmount) {
        errors.fixedAmount = 'Fixed amount must be provided'
      }
    }

    if (checkedWagerReq) {
      if (!wagerRequirementMultiplier) {
        errors.wagerRequirementMultiplier =
          'Wager requirement multiplier must be provided'
      }
    }

    if (checkedMinDeposit) {
      if (!minDeposit) {
        errors.minDeposit = 'Minimum deposit must be provided'
      }
    }
    if (expireBonus) {
      if (!expirationDate) {
        errors.expirationDate = 'Expiration must be provided'
      }
    }
    return errors
  }

  return (
    <Card>
      <Typography variant="body1" className={classes.status}>
        Status:
        {!matchPromo && ' Inactive'}
        {matchPromo &&
          matchPromo.canWithdraw &&
          ' Active - Waiting for next qualified deposit'}
        {matchPromo &&
          !matchPromo.canWithdraw &&
          ` Active - $${numeral(matchPromo.leftToWager).format(
            '0,0.00',
          )} left to wager`}
      </Typography>
      <CardContent>
        <div className={classes.root}>
          <Formik
            initialValues={{
              id: matchPromo?.id,
              bonusType:
                matchPromo?.bonusType === FIXED_TYPE.toLowerCase()
                  ? DEPOSIT_BONUS_TYPES[1]
                  : DEPOSIT_BONUS_TYPES[0],
              wagerRequirementMultiplier:
                matchPromo?.wagerRequirementMultiplier ?? undefined,
              percentMatch: matchPromo?.percentMatch
                ? matchPromo?.percentMatch
                : undefined,
              maxMatch: matchPromo?.maxMatch ? matchPromo?.maxMatch : undefined,
              minDeposit: matchPromo?.minDeposit ?? undefined,
              expirationDate: matchPromo?.expirationDate ?? undefined,
              reason: matchPromo?.reason ?? DEPOSIT_BONUS_REASONS[0],
              fixedAmount: matchPromo?.fixedAmount ?? undefined,
              specifiedReason: matchPromo?.reason ?? '',
            }}
            onSubmit={onSubmit}
            enableReinitialize
            validateOnChange={false}
            validate={validateDepositBonusForm}
            validateOnBlur={false}
            validateOnMount={false}
          >
            {({ values, errors, handleChange, setValues, resetForm }) => (
              <Form>
                <Grid container spacing={1} direction="column">
                  <Field
                    as={TextField}
                    select
                    variant="outlined"
                    label="Bonus Type"
                    size="small"
                    name="bonusType"
                    fullWidth
                    disabled={!!matchPromo}
                    value={values.bonusType}
                  >
                    {DEPOSIT_BONUS_TYPES.map(reason => (
                      <MenuItem key={reason} value={reason}>
                        {reason}
                      </MenuItem>
                    ))}
                  </Field>

                  {values.bonusType === FIXED_TYPE ? (
                    <>
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          name="fixedAmount"
                          autoComplete="off"
                          type="number"
                          error={!!errors.fixedAmount}
                          helperText={errors.fixedAmount}
                          disabled={!!matchPromo}
                          label="Fixed Amount"
                          placeholder="0"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          onChange={handleChange}
                          className={classes.Formik__items}
                        />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          name="percentMatch"
                          autoComplete="off"
                          type="number"
                          error={!!errors.percentMatch}
                          helperText={
                            (errors.percentMatch as string) || undefined
                          }
                          disabled={!!matchPromo}
                          label="Percent Match"
                          placeholder="0"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          onChange={handleChange}
                          className={classes.Formik__items}
                        />

                        <Field
                          as={TextField}
                          fullWidth
                          name="maxMatch"
                          autoComplete="off"
                          type="number"
                          error={!!errors.maxMatch}
                          helperText={(errors.maxMatch as string) || undefined}
                          disabled={!!matchPromo}
                          label="Max Match"
                          placeholder="0"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          onChange={handleChange}
                          className={classes.Formik__items}
                        />
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12}>
                    <FormControlLabel
                      label="Enable Wager Requirement"
                      control={
                        <Field
                          as={Checkbox}
                          disabled={!!matchPromo}
                          name="checkedWagerRequirement"
                          checked={checkedWagerReq}
                          onChange={() => setCheckedWagerReq(!checkedWagerReq)}
                        />
                      }
                    />
                    {checkedWagerReq && (
                      <Field
                        as={TextField}
                        fullWidth
                        name="wagerRequirementMultiplier"
                        autoComplete="off"
                        type="number"
                        error={!!errors.wagerRequirementMultiplier}
                        helperText={errors.wagerRequirementMultiplier}
                        disabled={!!matchPromo}
                        label="Wager requirement"
                        placeholder="0"
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      label="Enable Min Deposit"
                      control={
                        <Field
                          as={Checkbox}
                          name="checkedMinDeposit"
                          disabled={!!matchPromo}
                          checked={checkedMinDeposit}
                          onChange={() =>
                            setCheckedMinDeposit(!checkedMinDeposit)
                          }
                        />
                      }
                    />
                    {checkedMinDeposit && (
                      <Field
                        as={TextField}
                        fullWidth
                        name="minDeposit"
                        autoComplete="off"
                        type="number"
                        error={!!errors.minDeposit}
                        helperText={errors.minDeposit}
                        disabled={!!matchPromo}
                        label="Min Deposit"
                        placeholder="0"
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      label="Expiration Date (Optional)"
                      control={
                        <Field
                          disabled={!!matchPromo}
                          as={Checkbox}
                          name="expireBonus"
                          checked={expireBonus}
                          onChange={() => setExpireBonus(!expireBonus)}
                        />
                      }
                    />
                    {expireBonus && (
                      <DateTimePicker
                        fullWidth={true}
                        name="expirationDate"
                        label="Expiration Date"
                        value={values.expirationDate}
                        disabled={!!matchPromo}
                        helperText={
                          (errors.expirationDate as string) || undefined
                        }
                        disablePast={true}
                        onChange={date => {
                          setValues(values => ({
                            ...values,
                            expirationDate: date,
                          }))
                        }}
                      />
                    )}
                  </Grid>
                  <Field
                    as={TextField}
                    select
                    variant="outlined"
                    label="Reason"
                    size="small"
                    name="reason"
                    onChange={handleChange}
                    disabled={!!matchPromo}
                    error={!!errors.reason}
                    helperText={errors.reason}
                  >
                    {DEPOSIT_BONUS_REASONS.map(reason => (
                      <MenuItem key={reason} value={reason}>
                        {reason}
                      </MenuItem>
                    ))}
                  </Field>
                  {values.reason === OTHER_REASON && (
                    <Field
                      as={TextField}
                      fullWidth
                      name="specifiedReason"
                      autoComplete="off"
                      type="text"
                      disabled={!!matchPromo}
                      label="Specified Reason"
                      error={!!errors.specifiedReason}
                      helperText={errors.specifiedReason}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      onChange={handleChange}
                    />
                  )}
                </Grid>
                <CardActions className={classes.actions}>
                  {!matchPromo ? (
                    <CreateDepositBonusButton
                      disabled={!!matchPromo}
                      type="submit"
                      color="primary"
                    >
                      Enable Deposit Bonus
                    </CreateDepositBonusButton>
                  ) : (
                    <>
                      <UpdateDepositBonusButton
                        onClick={() => {
                          disableDepositBonus(false)
                          resetForm()
                        }}
                        color="primary"
                      >
                        Disable Deposit Bonus
                      </UpdateDepositBonusButton>
                      {checkedWagerReq && (
                        <UpdateDepositBonusButton
                          onClick={() => {
                            disableDepositBonus(true)
                            resetForm()
                          }}
                          className={classes.danger}
                        >
                          Forfeit Deposit Bonus
                        </UpdateDepositBonusButton>
                      )}
                    </>
                  )}
                </CardActions>
              </Form>
            )}
          </Formik>
        </div>
      </CardContent>
    </Card>
  )
}
