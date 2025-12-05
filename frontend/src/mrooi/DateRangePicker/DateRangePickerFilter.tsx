import React from 'react'
import moment, { type MomentInput } from 'moment'
import { FormLabel, FormControl, FormHelperText } from '@mui/material'
import { type MUIDataTableColumnOptions } from 'mui-datatables'

import { DateRangePicker } from './DateRangePicker'

export const formatFilterChip = (
  fieldName,
  start,
  end,
  format = 'ddd MMM DD, YYYY',
) => {
  const formattedStart = moment(start).format(format)
  const formattedEnd = moment(end).format(format)
  if (start && end) {
    return `${fieldName} between ${formattedStart} - ${formattedEnd}`
  }
  if (start) {
    return `${fieldName} after: ${formattedStart}`
  }
  if (end) {
    return `${fieldName} before: ${formattedEnd}`
  }
}

// Return false to include row (bc that makes sense).
const defaultFilterLogic = (value, filters) => {
  if (filters.length > 0) {
    const { start, end } = filters[0]

    if (start && end) {
      return !(value >= start && value <= end)
    }
  }

  return false
}

const helperText = 'Dates are in UTC'

export const DateRangePickerFilter = (
  name,
  logic = defaultFilterLogic,
  format = 'ddd MMM DD, YYYY',
  disableFuture = true,
  filterList: Array<{ start?: MomentInput; end?: MomentInput }> = [],
): MUIDataTableColumnOptions => ({
  filter: true,
  customFilterListOptions: {
    render: ([{ start, end }]) => formatFilterChip(name, start, end, format),
    update: (filterList, _, index) => {
      filterList[index] = []
      return filterList
    },
  },
  // @ts-expect-error @types package has incorrect type for filterList
  filterList,
  filterType: 'custom',
  filterOptions: {
    logic,
    display: (filterList, onChange, index, column) => (
      <FormControl variant="standard">
        <FormLabel>{name}</FormLabel>
        <DateRangePicker
          disableFuture={disableFuture}
          // @ts-expect-error @types package has incorrect type for filterList
          selectedDateRange={
            filterList[index][0] || {
              start: null,
              end: null,
            }
          }
          // TODO TODO AFTER MUI5-UPGRADE Check if this feature works properly
          onChange={value => {
            filterList[index] = [value.start, value.end]

            onChange([value.start, value.end], index, column)
          }}
        />
        <FormHelperText>{helperText}</FormHelperText>
      </FormControl>
    ),
  },
})
