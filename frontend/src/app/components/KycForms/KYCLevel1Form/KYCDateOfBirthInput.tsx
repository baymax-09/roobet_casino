import React from 'react'
import {
  InputLabel,
  NativeSelect,
  FormGroup,
  FormHelperText,
} from '@mui/material'
import moment from 'moment'

import { useLocale, useTranslate } from 'app/hooks'

import { DOB_FORMAT } from './constants'
import { useKycFormsStyles } from '../KycForms.styles'

interface KYCDateOfBirthInputProps {
  value: string
  setValue: (value: string) => void
  error?: string
  submitting: boolean
}

export const KYCDateOfBirthInput: React.FC<KYCDateOfBirthInputProps> = ({
  value,
  setValue,
  error,
  submitting,
}) => {
  const translate = useTranslate()
  const locale = useLocale()
  const classes = useKycFormsStyles()

  const dayField = React.useRef<HTMLSelectElement>(null)

  const [state, setState] = React.useState(() => {
    const parsed = moment(value, DOB_FORMAT)

    if (parsed.isValid()) {
      return {
        day: parsed.date(),
        month: parsed.month() + 1,
        year: parsed.year(),
      }
    }

    return {
      day: undefined,
      month: undefined,
      year: undefined,
    }
  })

  const getMonthName = monthIdx => {
    const objDate = new Date()
    objDate.setDate(1)
    objDate.setMonth(monthIdx - 1)

    return objDate.toLocaleString(locale, { month: 'short' })
  }

  const setFieldValue = (field: 'day' | 'month' | 'year', value: string) => {
    setState(prev => ({
      ...prev,
      [field]: Number(value),
    }))
  }

  // Focus on day field when there is an error.
  React.useEffect(() => {
    if (error) {
      dayField.current?.querySelector('select')?.focus()
    }
  }, [error])

  // Update parent form value.
  React.useEffect(() => {
    if (state.day && state.month && state.year) {
      const serialized = `${state.day}/${state.month}/${state.year}`

      setValue(serialized)
    }
  }, [state.day, state.month, state.year, setValue])

  const currentYear = new Date().getFullYear()
  const minYear = currentYear - 18

  return (
    <FormGroup className={classes.KYCForm__DOBFieldGroup}>
      <InputLabel shrink>{translate('kycLevel1Form.dateOfBirth')}</InputLabel>
      <div className={classes.DOBFieldGroup__DOBField}>
        <InputLabel shrink>{translate('kycLevel1Form.dobDay')}</InputLabel>
        <NativeSelect
          ref={dayField}
          error={!!error}
          inputProps={{
            onChange: event => setFieldValue('day', event.target.value),
          }}
          value={state.day ?? ''}
          required
          disabled={submitting}
        >
          <option value="" disabled>
            {translate('kycLevel1Form.dobDay')}
          </option>
          {[...new Array(31)].map((_, index) => (
            <option key={index} value={index + 1}>
              {`${index + 1}`.padStart(2, '0')}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className={classes.DOBFieldGroup__DOBField}>
        <InputLabel shrink>{translate('kycLevel1Form.dobMonth')}</InputLabel>
        <NativeSelect
          error={!!error}
          inputProps={{
            onChange: event => setFieldValue('month', event.target.value),
          }}
          value={state.month ?? ''}
          required
          disabled={submitting}
        >
          <option value="" disabled>
            {translate('kycLevel1Form.dobMonth')}
          </option>
          {[...new Array(12)].map((_, index) => (
            <option key={index} value={index + 1}>
              {`${index + 1}`.padStart(2, '0')} - {getMonthName(index + 1)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className={classes.DOBFieldGroup__DOBField}>
        <InputLabel shrink>{translate('kycLevel1Form.dobYear')}</InputLabel>
        <NativeSelect
          error={!!error}
          inputProps={{
            onChange: event => setFieldValue('year', event.target.value),
          }}
          value={state.year ?? ''}
          required
          disabled={submitting}
        >
          <option value="" disabled>
            {translate('kycLevel1Form.dobYear')}
          </option>
          {[...new Array(100)].map((_, index) => {
            const year = minYear - index

            return (
              <option key={index} value={year}>
                {year}
              </option>
            )
          })}
        </NativeSelect>
      </div>
      {error && <FormHelperText error={true}>{error}</FormHelperText>}
    </FormGroup>
  )
}
