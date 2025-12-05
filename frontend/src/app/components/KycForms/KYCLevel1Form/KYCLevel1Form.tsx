import React from 'react'
import {
  FormControl,
  Grid,
  InputLabel,
  NativeSelect,
  TextField,
} from '@mui/material'
import { useSelector } from 'react-redux'
import { useFormik } from 'formik'
import moment from 'moment'

import { LoadingButton } from 'mrooi'
import { countries } from 'app/util/countries'
import { useTranslate } from 'app/hooks'
import { type KYCGet } from 'common/types'
import { useAxiosPost, useToasts } from 'common/hooks'
import { getAccount } from 'app/lib/user'
import { IndianStates } from 'app/util'

import { KYCAddressLine1Field } from './KYCAddressLine1Field'
import { KYCDateOfBirthInput } from './KYCDateOfBirthInput'
import { useKycFormsStyles } from '../KycForms.styles'
import {
  type Level1FormValues,
  level1FieldDefaults,
  DOB_FORMAT,
} from './constants'

const indianCountryCodeRegexp = /^\D*91/
interface KYCLevel1FormProps {
  kyc?: KYCGet
  proceed?: () => void
  customButtonText?: string
  isPhoneRequired?: boolean
}

const parseFormValues = (
  kyc?: KYCGet,
  countryCode?: string,
): Level1FormValues => {
  const values: Level1FormValues = { ...level1FieldDefaults }

  // Replace existing values.
  if (kyc) {
    for (const [key, val] of Object.entries(kyc)) {
      if (key in values) {
        values[key] = val
      }
    }
  }

  // Default country to IP location.
  if (!values.addressCountry && countryCode) {
    const isValidCountryCode = !!countries.find(
      ({ code }) => code === countryCode,
    )

    if (isValidCountryCode) {
      values.addressCountry = countryCode
    }
  }

  return values
}

export const KYCLevel1Form: React.FC<KYCLevel1FormProps> = React.memo(
  ({ kyc, proceed, customButtonText, isPhoneRequired = false }) => {
    const translate = useTranslate()
    const classes = useKycFormsStyles()
    const { toast } = useToasts()

    const saveButtonRef = React.useRef<HTMLButtonElement>(null)

    const countryCode: string | null = useSelector(
      ({ settings }) => settings?.countryCode ?? null,
    )
    const seonHeader = {
      'X-Seon-Session-Payload': window.seonSessionPayload || '',
    }

    const [save, { loading }] = useAxiosPost<
      KYCGet,
      { kycInfo: Level1FormValues }
    >('user/kycv2/saveLevel1Details', {
      config: {
        headers: seonHeader,
      },
      onError: (error: Error & { field?: string }) => {
        if (error.field) {
          formik.setFieldError(error.field, error.message)
          return
        }

        // Else, show toast for unknown error types.
        toast.error(error.message)
      },

      // Continue to next KYC level.
      onCompleted: () => {
        if (proceed) {
          proceed()
        }
        getAccount()
      },
    })

    const initialValues = React.useMemo(() => {
      return parseFormValues(kyc, countryCode ?? undefined)
    }, [kyc, countryCode])

    const formik = useFormik<Level1FormValues>({
      initialValues,
      validateOnChange: false,
      validateOnBlur: false,
      onSubmit: async (values, { setSubmitting }) => {
        // Submit new values to API.
        await save({ variables: { kycInfo: values } })
      },
      validate: values => {
        // Clear errors first to trigger effects.
        formik.setErrors({})

        const dob = moment(values.dob, DOB_FORMAT)

        if (!dob.isValid()) {
          return {
            dob: translate('kycLevel1Form.dobInvalid'),
          }
        }

        if (moment().diff(dob, 'years') < 18) {
          return {
            dob: translate('kycLevel1Form.dobUnderage'),
          }
        }

        if (
          values.addressCountry === 'IN' &&
          isPhoneRequired &&
          !indianCountryCodeRegexp.test(values.phone)
        ) {
          return {
            phone: translate('kycLevel1Form.phoneInvalidIndia'),
          }
        }
      },
    })

    const { setFieldValue, values, validateForm } = formik

    // Validate form when DOB changes.
    React.useEffect(() => {
      if (values.dob) {
        validateForm()
      }
    }, [validateForm, values.dob])

    const setDobValue = React.useCallback(
      (value: string) => {
        setFieldValue('dob', value)
      },
      [setFieldValue],
    )

    return (
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              variant="standard"
              margin="none"
              required
              name="firstName"
              disabled={loading}
              label={translate('kycLevel1Form.firstName')}
              type="text"
              autoComplete="off"
              placeholder={translate('kycLevel1Form.firstName')}
              fullWidth
              size="small"
              value={formik.values.firstName}
              helperText={formik.errors.firstName}
              error={!!formik.errors.firstName}
              onChange={formik.handleChange}
              inputProps={{ minLength: 2 }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              variant="standard"
              margin="none"
              required
              name="lastName"
              disabled={loading}
              autoComplete="off"
              label={translate('kycLevel1Form.lastName')}
              type="text"
              placeholder={translate('kycLevel1Form.lastName')}
              fullWidth
              size="small"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              helperText={formik.errors.lastName}
              error={!!formik.errors.lastName}
              inputProps={{ minLength: 2 }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <KYCDateOfBirthInput
              value={formik.values.dob}
              setValue={setDobValue}
              error={formik.errors.dob}
              submitting={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl
              variant="standard"
              disabled={loading}
              fullWidth
              margin="none"
              required
            >
              <InputLabel shrink>
                {translate('kycLevel1Form.country')}
              </InputLabel>
              <NativeSelect
                value={formik.values.addressCountry}
                onChange={formik.handleChange}
                error={!!formik.errors.addressCountry}
                inputProps={{
                  name: 'addressCountry',
                  style: { height: 16, fontSize: 16 },
                }}
              >
                <option value="">
                  {translate('kycLevel1Form.selectACountry')}
                </option>
                {countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </NativeSelect>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <KYCAddressLine1Field formik={formik} submitting={loading} />
          </Grid>
          <Grid item xs={12}>
            <TextField
              variant="standard"
              margin="none"
              required={false}
              name="addressLine2"
              disabled={loading || !formik.values.addressCountry}
              autoComplete="off"
              label={translate('kycLevel1Form.addressLine2')}
              type="text"
              placeholder={translate('kycLevel1Form.addressLine2Desc')}
              fullWidth
              size="small"
              value={formik.values.addressLine2}
              helperText={formik.errors.addressLine2}
              error={!!formik.errors.addressLine2}
              onChange={formik.handleChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              variant="standard"
              margin="none"
              required
              name="addressCity"
              disabled={loading || !formik.values.addressCountry}
              autoComplete="off"
              label={translate('kycLevel1Form.city')}
              type="text"
              placeholder={translate('kycLevel1Form.city')}
              fullWidth
              size="small"
              value={formik.values.addressCity}
              helperText={formik.errors.addressCity}
              error={!!formik.errors.addressCity}
              inputProps={{ minLength: 2 }}
              onChange={formik.handleChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            {formik.values.addressCountry === 'IN' ? (
              <FormControl
                variant="standard"
                disabled={loading}
                fullWidth
                margin="none"
                required
              >
                <InputLabel shrink>
                  {translate('kycLevel1Form.stateProvince')}
                </InputLabel>
                <NativeSelect
                  value={formik.values.addressState}
                  onChange={formik.handleChange}
                  error={!!formik.errors.addressState}
                  inputProps={{
                    name: 'addressState',
                    style: { height: 16, fontSize: 16 },
                  }}
                >
                  <option value="">
                    {translate('kycLevel1Form.stateProvince')}
                  </option>
                  {IndianStates.map(state => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </NativeSelect>
              </FormControl>
            ) : (
              <TextField
                variant="standard"
                margin="none"
                required
                name="addressState"
                disabled={loading || !formik.values.addressCountry}
                autoComplete="off"
                label={translate('kycLevel1Form.stateProvince')}
                type="text"
                placeholder={translate('kycLevel1Form.stateProvince')}
                fullWidth
                size="small"
                value={formik.values.addressState}
                helperText={formik.errors.addressState}
                error={!!formik.errors.addressState}
                onChange={formik.handleChange}
                inputProps={{ minLength: 2 }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              variant="standard"
              margin="none"
              required
              name="addressPostalCode"
              disabled={loading || !formik.values.addressCountry}
              autoComplete="off"
              label={translate('kycLevel1Form.postalCode')}
              type="text"
              placeholder={translate('kycLevel1Form.postalCode')}
              fullWidth
              size="small"
              value={formik.values.addressPostalCode}
              helperText={formik.errors.addressPostalCode}
              error={!!formik.errors.addressPostalCode}
              onChange={formik.handleChange}
              inputProps={{ minLength: 2 }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              variant="standard"
              margin="none"
              required={isPhoneRequired}
              name="phone"
              disabled={loading}
              autoComplete="off"
              label={translate('kycLevel1Form.phoneNumber')}
              type="tel"
              placeholder={translate('kycLevel1Form.examplePhone')}
              fullWidth
              size="small"
              value={formik.values.phone}
              helperText={formik.errors.phone}
              error={!!formik.errors.phone}
              onChange={formik.handleChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>
        <div className={classes.KYCForm__actions}>
          <LoadingButton
            color="primary"
            label={customButtonText || translate('kycForm.save')}
            loading={loading}
            ref={saveButtonRef}
            type="submit"
          />
        </div>
      </form>
    )
  },
)
