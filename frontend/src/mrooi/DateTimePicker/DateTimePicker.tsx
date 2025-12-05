import React, { type ReactNode } from 'react'
import {
  DateTimePicker as MUIDateTimePicker,
  type DateTimePickerProps as MUIDateTimePickerProps,
} from '@mui/x-date-pickers/DateTimePicker'
import moment, { type Moment } from 'moment'
import { FormControl, FormHelperText } from '@mui/material'

import { useDateTimePickerStyles } from './DateTimePicker.styles'

interface DateTimePickerProps extends MUIDateTimePickerProps<Moment> {
  helperText?: ReactNode
  fullWidth?: boolean
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  helperText,
  fullWidth = false,
  value,
  ...props
}) => {
  const classes = useDateTimePickerStyles()

  return (
    <FormControl
      variant="standard"
      margin="normal"
      className={classes.root}
      fullWidth={fullWidth}
    >
      <MUIDateTimePicker ampm={true} value={moment(value)} {...props} />
      <FormHelperText>{helperText ?? 'Dates are in UTC'}</FormHelperText>
    </FormControl>
  )
}
