import React, { useState } from 'react'
import { Typography } from '@mui/material'
import {
  DateTimePicker,
  type DateTimePickerProps,
} from '@mui/x-date-pickers/DateTimePicker'
import {
  DatePicker,
  type DatePickerProps,
} from '@mui/x-date-pickers/DatePicker'
import moment, { type MomentInput, type Moment } from 'moment'

import { useDateRangePickerStyles } from './DateRangePicker.styles'

interface DateRange {
  start: string
  end: string
}

type DateRangePickerProps = {
  selectedDateRange: DateRange
  onChange: (dateRange: DateRange) => void
  startDatePickerProps?: DateTimePickerProps<Moment>
  endDatePickerProps?: DateTimePickerProps<Moment>
  momentFormat?: string
  disableFuture?: boolean
  time?: boolean
} & (
  | {
      time?: true
      startDatePickerProps?: DateTimePickerProps<Moment>
      endDatePickerProps?: DateTimePickerProps<Moment>
    }
  | {
      time: false
      startDatePickerProps?: DatePickerProps<Moment>
      endDatePickerProps?: DatePickerProps<Moment>
    }
)

export const DateRangePicker: React.FC<DateRangePickerProps> = props => {
  const {
    selectedDateRange,
    onChange,
    momentFormat,
    disableFuture = true,
  } = props

  const classes = useDateRangePickerStyles()
  const [dateRangeError, setDateRangeError] = useState('')

  const handleDateRangeChange = (value, isStartOfRange) => {
    const newDateRange = isStartOfRange
      ? { ...selectedDateRange, start: convertFromMomentToString(value) }
      : { ...selectedDateRange, end: convertFromMomentToString(value) }

    if (newDateRange.end < newDateRange.start) {
      setDateRangeError('Please select a valid date range.')
    } else {
      setDateRangeError('')
      onChange(newDateRange)
    }
  }

  const convertFromMomentToString = (momentObj: Moment): string => {
    return momentFormat
      ? momentObj.format(momentFormat)
      : momentObj.toISOString()
  }

  interface DateComponentProps {
    label: string
    value: MomentInput
    isStartOfRange?: true
  }

  const DateComponent: React.FC<DateComponentProps> = ({
    label,
    value,
    isStartOfRange,
  }) => {
    if (props.time === false) {
      return (
        <DatePicker
          label={label}
          value={moment(value)}
          disableFuture={disableFuture}
          onChange={value => handleDateRangeChange(value, isStartOfRange)}
          {...props.startDatePickerProps}
        />
      )
    }

    return (
      <DateTimePicker
        label={label}
        value={moment(value)}
        disableFuture={disableFuture}
        onChange={value =>
          handleDateRangeChange(value, isStartOfRange ?? false)
        }
        {...props.startDatePickerProps}
      />
    )
  }

  return (
    <div>
      {dateRangeError && (
        <Typography variant="body2" color="error" paragraph>
          {dateRangeError}
        </Typography>
      )}

      <div className={classes.datePickerContainer}>
        <div className={classes.datePicker}>
          <DateComponent
            isStartOfRange
            label="Start Date"
            value={selectedDateRange.start}
          />
        </div>
        <div className={classes.datePicker}>
          <DateComponent label="End Date" value={selectedDateRange.end} />
        </div>
      </div>
    </div>
  )
}

export default React.memo(DateRangePicker)
