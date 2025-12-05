import React, { useState } from 'react'
import ReactJson from 'react-json-view'
import moment from 'moment'

import { DateRangePicker } from 'mrooi'
import { useAxiosGet, useToasts } from 'common/hooks'
import { useDarkMode } from 'admin/context'

import { useStatsByRangeStyles } from './StatsByRange.styles'

const MOMENT_FORMAT = 'YYYYMMDD'

export const StatsByRange: React.FC = () => {
  const classes = useStatsByRangeStyles()
  const [isDarkMode] = useDarkMode()
  const { toast } = useToasts()

  const [selectedDateRange, setSelectedDateRange] = useState({
    start: moment().format(MOMENT_FORMAT),
    end: moment().format(MOMENT_FORMAT),
  })

  const formattedStartDate = parseInt(
    moment(selectedDateRange.start).format('YYYYMMDD'),
  )
  const formattedEndDate = parseInt(
    moment(selectedDateRange.end).format('YYYYMMDD'),
  )

  const [{ data: currentReportData }] = useAxiosGet<{
    quickView?: object
    stats?: object
  }>(
    `/admin/statsByRange?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
    {
      onError: error =>
        error.response
          ? console.error(error)
          : toast.error(error.response.data),
    },
  )

  return (
    <div className={classes.root}>
      <DateRangePicker
        time={false}
        selectedDateRange={selectedDateRange}
        onChange={value => {
          setSelectedDateRange(value)
        }}
        momentFormat={MOMENT_FORMAT}
      />

      <div className={classes.json}>
        <ReactJson
          theme={isDarkMode ? 'monokai' : undefined}
          src={currentReportData?.quickView || {}}
          name="quickView"
        />
      </div>

      <div className={classes.json}>
        <ReactJson
          theme={isDarkMode ? 'monokai' : undefined}
          src={currentReportData?.stats || {}}
          name="stats"
        />
      </div>
    </div>
  )
}
