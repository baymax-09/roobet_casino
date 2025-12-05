import React from 'react'
import { FormGroup, useMediaQuery } from '@mui/material'
import moment from 'moment'
import {
  Dropdown,
  type DropdownProps,
  InputLabel,
  Typography,
  theme as uiTheme,
} from '@project-atl/ui'

import { useLocale, useTranslate } from 'app/hooks'

import { DOB_FORMAT } from '../constants'

import { useKYCDateOfBirthInputStyles } from './KYCDateOfBirthInput.styles'

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
  const classes = useKYCDateOfBirthInputStyles()

  const dayField = React.useRef<HTMLSelectElement>(null)
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

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

  const days = React.useMemo(
    () =>
      [...new Array(31)].map((_, index) => ({
        name: `${index + 1}`.padStart(2, '0'),
        value: index + 1,
      })),
    [],
  )

  const months = React.useMemo(
    () =>
      [...new Array(12)].map((_, index) => ({
        name: `${`${index + 1}`.padStart(2, '0')} - ${getMonthName(index + 1)}`,
        value: index + 1,
      })),
    [getMonthName],
  )

  const years = React.useMemo(
    () =>
      [...new Array(100)].map((_, index) => {
        const year = minYear - index
        return {
          name: year,
          value: year,
        }
      }),
    [minYear],
  )

  const renderValue = (value: string) => (
    <Typography
      fontSize={uiTheme.typography.body2.fontSize}
      fontWeight={uiTheme.typography.fontWeightBold}
    >
      {value}
    </Typography>
  )

  const commonDropdownProps: Partial<DropdownProps> = {
    color: 'secondary',
    fullWidth: true,
    menuItemProps: { includeCheck: true },
    error: !!error,
    required: true,
    disabled: submitting,
    search: true,
    dropdownWidth: isTabletOrDesktop ? 133.3 : 'initial',
    searchProps: {
      placeholder: translate('kycLevel1Form.search'),
      autoFocus: true,
    },
  }

  return (
    <FormGroup className={classes.KYCForm__DOBFieldGroup}>
      <InputLabel htmlFor="dateOfBirth">
        {translate('kycLevel1Form.dateOfBirth')}
      </InputLabel>
      <div id="dateOfBirth" className={classes.KYCForm__DOBFields}>
        <Dropdown
          ref={dayField}
          renderValue={() =>
            renderValue((state.day?.toString() ?? 'Day').padStart(2, '0'))
          }
          value={state.day?.toString() ?? 'Day'}
          placeholder={translate('kycLevel1Form.dobDay')}
          onChange={event => {
            const value = event.target.value
            if (typeof value === 'string') {
              setFieldValue('day', value)
            }
          }}
          menuOptions={[
            {
              name: 'Day',
              value: 'Day',
              props: { disabled: state.day !== undefined },
            },
            ...days.map(({ name, value }) => ({
              name,
              value: value.toString(),
            })),
          ]}
          {...commonDropdownProps}
        />
        <Dropdown
          ref={dayField}
          renderValue={() =>
            renderValue(
              months.find(month => month.value === state.month)?.name ??
                'Month',
            )
          }
          value={state.month?.toString() ?? 'Month'}
          placeholder={translate('kycLevel1Form.dobMonth')}
          onChange={event => {
            const value = event.target.value
            if (typeof value === 'string') {
              setFieldValue('month', value)
            }
          }}
          menuOptions={[
            {
              name: 'Month',
              value: 'Month',
              props: { disabled: state.month !== undefined },
            },
            ...months.map(({ name, value }) => ({
              name,
              value: value.toString(),
              searchValue: name,
            })),
          ]}
          {...commonDropdownProps}
        />
        <Dropdown
          ref={dayField}
          renderValue={() => renderValue(state.year?.toString() ?? 'Year')}
          value={state.year?.toString() ?? 'Year'}
          placeholder={translate('kycLevel1Form.dobYear')}
          onChange={event => {
            const value = event.target.value
            if (typeof value === 'string') {
              setFieldValue('year', value)
            }
          }}
          menuOptions={[
            {
              name: 'Year',
              value: 'Year',
              props: { disabled: state.year !== undefined },
            },
            ...years.map(({ name, value }) => ({
              name,
              value: value.toString(),
            })),
          ]}
          {...commonDropdownProps}
        />
      </div>
    </FormGroup>
  )
}
