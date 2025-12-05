import React from 'react'
import { Form, Formik } from 'formik'
import {
  Button,
  FormControlLabel,
  TextField,
  Typography,
  Checkbox,
  MenuItem,
  Paper,
} from '@mui/material'

import { api, isApiError } from 'common/util'
import { useBalanceTypes } from 'admin/hooks'
import { useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'
import { TitleContainer } from 'mrooi'
import { helperTextErrorHelper } from 'admin/util/form'

import { useCreatePromoRouteStyles } from './CreatePromoRoute.styles'

const CreateAccessButton = withRulesAccessController(['promos:create'], Button)
const CreateAccessForm = withRulesAccessController(['promos:create'], Formik)

export const CreatePromoRoute: React.FC = () => {
  const classes = useCreatePromoRouteStyles()
  const { toast } = useToasts()

  const balanceTypes = useBalanceTypes()

  const createPromo = async values => {
    const {
      code,
      showDepositLimit,
      showWagerLimit,
      showDepositCount,
      depositCountHours,
      depositCountAmount,
      showAffiliateName,
      showCxAffId,
      depositLimitAmount,
      depositLimitHours,
      wagerLimitAmount,
      wagerLimitHours,
      roowardsBonus,
      claimAmount,
      ...rest
    } = values

    try {
      await api.put('/promo/admin', {
        code: code.toLowerCase(),
        // send false if no deposit limit attributes were changed, else send the object
        depositLimit:
          showDepositLimit === false
            ? false
            : {
                hours: depositLimitHours,
                amount: depositLimitAmount,
              },
        wagerLimit:
          showWagerLimit === false
            ? false
            : {
                hours: wagerLimitHours,
                amount: wagerLimitAmount,
              },
        depositCount:
          showDepositCount === false
            ? false
            : {
                hours: depositCountHours,
                amount: depositCountAmount,
              },
        claimAmount: roowardsBonus ? 0 : claimAmount,
        roowardsBonus,
        ...rest,
      })
      toast.success('Promo successfully created.')
    } catch (err) {
      if (isApiError(err)) {
        toast.error(err.response.data)
      } else {
        toast.error('Unkown error while creating promo.')
      }
    }
  }

  return (
    <TitleContainer
      title="Create Promotion"
      returnTo={{
        title: 'Promotions',
        link: '/crm/promos',
      }}
      actions={() => []}
    >
      <Paper elevation={4} className={classes.CreatePromo__formContainer}>
        <CreateAccessForm
          initialValues={{
            balanceType: '',
            code: '',
            roowardsBonus: false,
            claimAmount: 0,
            claimsRemaining: 0,
            expireTime: 1,
            hasNotDeposited: false,
            showDepositLimit: false,
            showWagerLimit: false,
            depositCountAmount: 0,
            depositCountHours: 0,
            showDepositCount: false,
            depositLimitAmount: 0,
            depositLimitHours: 0,
            showAffiliateName: false,
            mustBeAffiliated: false,
            affiliateName: '',
            showCxAffId: false,
            cxAffId: '',
          }}
          enableReinitialize
          onSubmit={createPromo}
        >
          {({ values, errors, handleChange, setFieldValue }) => (
            <div>
              <Form className={classes.form}>
                <TextField
                  variant="standard"
                  select
                  disabled={values.roowardsBonus}
                  fullWidth
                  name="balanceType"
                  type="text"
                  value={values.balanceType}
                  error={!!errors.balanceType}
                  helperText={helperTextErrorHelper(errors.balanceTypeOverride)}
                  onChange={handleChange}
                  label="Balance Type"
                  required={!values.roowardsBonus}
                >
                  {balanceTypes.map(data => (
                    <MenuItem key={data} value={data}>
                      {data}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  variant="standard"
                  fullWidth
                  name="code"
                  type="text"
                  value={values.code}
                  error={!!errors.code}
                  helperText={helperTextErrorHelper(errors.code)}
                  onChange={handleChange}
                  label="Code Name"
                />

                <FormControlLabel
                  label={
                    <Typography variant="body2">
                      Roowards Bonus (Instead of $$)
                    </Typography>
                  }
                  control={
                    <Checkbox
                      name="roowardsBonus"
                      checked={values.roowardsBonus}
                      onChange={event => {
                        handleChange(event)
                        setFieldValue('claimAmount', 0)
                        if (event.target.checked) {
                          setFieldValue('balanceType', '')
                        }
                      }}
                    />
                  }
                />

                <TextField
                  variant="standard"
                  disabled={values.roowardsBonus}
                  fullWidth
                  name="claimAmount"
                  type="number"
                  value={values.claimAmount}
                  error={!!errors.claimAmount}
                  helperText={helperTextErrorHelper(errors.claimAmount)}
                  onChange={handleChange}
                  label="Amount ($) Per Claim"
                />

                <TextField
                  variant="standard"
                  fullWidth
                  name="claimsRemaining"
                  type="number"
                  value={values.claimsRemaining}
                  error={!!errors.claimsRemaining}
                  helperText={helperTextErrorHelper(errors.claimsRemaining)}
                  onChange={handleChange}
                  label="# of Claims"
                />

                <TextField
                  variant="standard"
                  fullWidth
                  name="expireTime"
                  type="number"
                  value={values.expireTime}
                  error={!!errors.expireTime}
                  helperText={helperTextErrorHelper(errors.expireTime)}
                  onChange={handleChange}
                  label="Expires In (# of Hours)"
                />

                <FormControlLabel
                  label="Has not deposited"
                  control={
                    <Checkbox
                      name="hasNotDeposited"
                      checked={values.hasNotDeposited}
                      onChange={handleChange}
                    />
                  }
                />

                {/* Start has deposited over fields */}
                <FormControlLabel
                  label="Has deposited over $x.xx"
                  control={
                    <Checkbox
                      name="showDepositLimit"
                      checked={values.showDepositLimit}
                      onChange={event => {
                        handleChange(event)
                        if (!event.target.checked) {
                          setFieldValue('depositLimitAmount', 0)
                          setFieldValue('depositLimitHours', 0)
                        }
                      }}
                    />
                  }
                />

                {values.showDepositLimit && (
                  <>
                    <TextField
                      variant="standard"
                      fullWidth
                      name="depositLimitAmount"
                      type="number"
                      value={values.depositLimitAmount}
                      error={!!errors.depositLimitAmount}
                      helperText={helperTextErrorHelper(
                        errors.depositLimitAmount,
                      )}
                      onChange={handleChange}
                      label="Amount Deposited"
                    />

                    <TextField
                      variant="standard"
                      fullWidth
                      name="depositLimitHours"
                      type="number"
                      value={values.depositLimitHours}
                      error={!!errors.depositLimitHours}
                      helperText={helperTextErrorHelper(
                        errors.depositLimitHours || '0 for lifetime of account',
                      )}
                      onChange={handleChange}
                      label="Last x hours"
                    />
                  </>
                )}
                {/* End has deposited over fields */}

                {/* Start has wagered over fields */}
                <FormControlLabel
                  label="Has wagered over $x.xx"
                  control={
                    <Checkbox
                      name="showWagerLimit"
                      checked={values.showWagerLimit}
                      onChange={event => {
                        handleChange(event)
                        if (!event.target.checked) {
                          setFieldValue('wagerLimitAmount', 0)
                          setFieldValue('wagerLimitHours', 0)
                        }
                      }}
                    />
                  }
                />

                {values.showWagerLimit && (
                  <>
                    <TextField
                      variant="standard"
                      fullWidth
                      name="wagerLimitAmount"
                      type="number"
                      value={values.wagerLimitAmount}
                      error={!!errors.wagerLimitAmount}
                      helperText={helperTextErrorHelper(
                        errors.wagerLimitAmount,
                      )}
                      onChange={handleChange}
                      label="Amount Wagered"
                    />

                    <TextField
                      variant="standard"
                      fullWidth
                      name="wagerLimitHours"
                      type="number"
                      value={values.wagerLimitHours}
                      error={!!errors.wagerLimitHours}
                      helperText={helperTextErrorHelper(
                        errors.wagerLimitHours || '0 for lifetime of account',
                      )}
                      onChange={handleChange}
                      label="Last x hours"
                    />
                  </>
                )}
                {/* End has wagered over fields */}

                {/* Start Cellxpert fields */}
                <FormControlLabel
                  label="Is Cellxpert Affiliate"
                  control={
                    <Checkbox
                      name="showCxAffId"
                      checked={values.showCxAffId}
                      onChange={event => {
                        handleChange(event)
                        if (!event.target.checked) {
                          setFieldValue('cxAffId', '')
                        }
                      }}
                    />
                  }
                />

                {values.showCxAffId && (
                  <TextField
                    variant="standard"
                    fullWidth
                    name="cxAffId"
                    type="string"
                    value={values.cxAffId}
                    error={!!errors.cxAffId}
                    helperText={helperTextErrorHelper(errors.cxAffId)}
                    onChange={handleChange}
                    label="CxAffId"
                  />
                )}

                {/* End Cellxpert fields */}

                {/* Start X deposits fields */}
                <FormControlLabel
                  label="Has made x deposits"
                  control={
                    <Checkbox
                      name="showDepositCount"
                      checked={values.showDepositCount}
                      onChange={event => {
                        handleChange(event)
                        if (!event.target.checked) {
                          setFieldValue('depositCountNumber', 0)
                          setFieldValue('depositCountHours', 0)
                        }
                      }}
                    />
                  }
                />

                {values.showDepositCount && (
                  <>
                    <TextField
                      variant="standard"
                      fullWidth
                      name="depositCountAmount"
                      type="number"
                      value={values.depositCountAmount}
                      error={!!errors.depositCountAmount}
                      helperText={helperTextErrorHelper(
                        errors.depositCountAmount,
                      )}
                      onChange={handleChange}
                      label="# of deposits"
                    />

                    <TextField
                      variant="standard"
                      fullWidth
                      name="depositCountHours"
                      type="number"
                      value={values.depositCountHours}
                      error={!!errors.depositCountHours}
                      helperText={helperTextErrorHelper(
                        errors.depositCountHours || '0 for lifetime of account',
                      )}
                      onChange={handleChange}
                      label="Last x hours"
                    />
                  </>
                )}
                {/* End X deposits fields */}

                {/* Start affiliate fields */}
                <FormControlLabel
                  label="Link code to affiliate"
                  control={
                    <Checkbox
                      name="showAffiliateName"
                      checked={values.showAffiliateName}
                      onChange={event => {
                        handleChange(event)
                        if (!event.target.checked) {
                          setFieldValue('mustBeAffiliated', false)
                          setFieldValue('affiliateName', '')
                        }
                      }}
                    />
                  }
                />
                {values.showAffiliateName && (
                  <FormControlLabel
                    label="Must be affiliated"
                    control={
                      <Checkbox
                        name="mustBeAffiliated"
                        checked={values.mustBeAffiliated}
                        onChange={handleChange}
                      />
                    }
                  />
                )}
                {values.showAffiliateName && (
                  <TextField
                    variant="standard"
                    fullWidth
                    name="affiliateName"
                    type="text"
                    value={values.affiliateName}
                    error={!!errors.affiliateName}
                    helperText={helperTextErrorHelper(errors.affiliateName)}
                    onChange={handleChange}
                    label="Affiliate Name"
                  />
                )}
                {/* End affiliate fields */}

                <CreateAccessButton
                  type="submit"
                  color="primary"
                  variant="contained"
                >
                  Create Promo
                </CreateAccessButton>
              </Form>
            </div>
          )}
        </CreateAccessForm>
      </Paper>
    </TitleContainer>
  )
}
