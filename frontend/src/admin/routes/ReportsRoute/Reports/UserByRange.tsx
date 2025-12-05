import React, { useState } from 'react'
import { Button, TextField } from '@mui/material'
import moment from 'moment'
import numeral from 'numeral'
import { type MUIDataTableColumn } from 'mui-datatables'
import { type Writable } from 'ts-essentials'

import { DataTable, DateRangePicker } from 'mrooi'
import { useAxiosGet, useToasts } from 'common/hooks'

import { useReportsRouteStyles } from './UserByRange.styles'

const MOMENT_FORMAT = 'YYYYMMDD'

const columnOptions = {
  filter: false,
  sort: false,
} as const
const defaultColumnKeys = [
  'username',
  'totalBalance',
  'deposited',
  'withdrawn',
] as const
const isColumnKey = (value: any) => defaultColumnKeys.includes(value)
const defaultColumns: MUIDataTableColumn[] = [
  {
    name: 'username',
    label: 'username',
    options: {
      ...columnOptions,
      display: defaultColumnKeys.includes('username'),
    },
  },
  {
    name: 'totalBalance',
    label: 'totalBalance',
    options: {
      ...columnOptions,
      display: defaultColumnKeys.includes('totalBalance'),
    },
  },
]

const getTableColumnsFromResponse = (
  responseData,
): Readonly<MUIDataTableColumn[]> => {
  // we have some defaults that don't come from stats
  const columns = [...defaultColumns]
  if (!responseData.length) {
    return columns
  }

  for (const key of Object.keys(responseData[0].stats)) {
    columns.push({
      name: key,
      label: key,
      options: { ...columnOptions, display: isColumnKey(key) },
    })
  }
  return columns
}

const getTableDataFromResponse = responseData =>
  responseData.map(i => ({
    ...i.stats,
    username: i.user.name,
    totalBalance: numeral(i.user.totalBalance).format('$0,0.00'),
    deposited: numeral(i.stats.deposited).format('$0,0.00'),
    withdrawn: numeral(i.stats.withdrawn).format('$0,0.00'),
  }))

export const UserByRange: React.FC = () => {
  const classes = useReportsRouteStyles()
  const { toast } = useToasts()

  const [orderBy, setOrderBy] = useState('deposited')
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: moment().format(MOMENT_FORMAT),
    end: moment().format(MOMENT_FORMAT),
  })
  const [params, setParams] = useState({
    selectedDateRange,
    orderBy,
  })

  const formattedStartDate = parseInt(
    moment(params.selectedDateRange.start).format('YYYYMMDD'),
  )
  const formattedEndDate = parseInt(
    moment(params.selectedDateRange.end).format('YYYYMMDD'),
  )
  const [{ data }] = useAxiosGet(
    `/admin/userStats?startDate=${formattedStartDate}&endDate=${formattedEndDate}&orderBy=${params.orderBy}`,
    {
      onError: error => {
        console.error(error)
        toast.error(error.response.data)
      },
    },
  )

  const tableColumns = React.useMemo(
    () => (!data ? defaultColumns : getTableColumnsFromResponse(data)),
    [data],
  )
  const tableData = React.useMemo(
    () => getTableDataFromResponse(data || []),
    [data],
  )

  return (
    <div className={classes.root}>
      <div className={classes.inputs}>
        <TextField
          variant="outlined"
          type="text"
          label="Order By"
          onChange={event => setOrderBy(event.target.value)}
          size="small"
          value={orderBy}
        />

        <DateRangePicker
          time={false}
          selectedDateRange={selectedDateRange}
          onChange={value => {
            setSelectedDateRange(value)
          }}
          momentFormat={MOMENT_FORMAT}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setParams({
              selectedDateRange,
              orderBy,
            })
          }}
        >
          Run Report
        </Button>
      </div>

      <DataTable
        data={tableData}
        columns={tableColumns as Writable<typeof tableColumns>} // MUIDatatable should accept Readonly arrays...
      />
    </div>
  )
}
