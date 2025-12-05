import React from 'react'
import { TableRow, TableCell, Paper } from '@mui/material'
import ReactJson from 'react-json-view'
import numeral from 'numeral'

import { DataTable, DateRangePickerFilter } from 'mrooi'
import { createMoment } from 'common/util/date'
import { ViewOnBlockchair } from 'admin/components'
import { env } from 'common/constants'
import { useDarkMode } from 'admin/context'

import { type UserData } from '../types'

import { useWithdrawalsStyles } from './Withdrawals.styles'

const pluginList = [
  'AstroPayCard',
  'Interac',
  'MuchBetter',
  'Payop',
  'BestPay',
  'SafeCharge',
  'Directa24',
  'Payper',
  'totalProcessing',
  'bitcoin',
  'ethereum',
  'litecoin',
  'dogecoin',
]

interface WithdrawalsProps {
  userData: UserData
}

interface WithdrawalData {
  transactionId: string
  createdAt: string
  plugin: string
  provider: string
  amount: number
  totalValue: number
}

export const Withdrawals: React.FC<WithdrawalsProps> = ({ userData }) => {
  const classes = useWithdrawalsStyles()
  const [isDarkMode] = useDarkMode()

  const [data, setData] = React.useState<WithdrawalData[]>([])

  const options = React.useMemo(
    () => ({
      expandableRows: true,
      expandableRowsHeader: false,
      expandableRowsOnClick: true,
      sort: false,
      filter: true,
      setTableProps: () => {
        return {
          // padding: 'none',

          // material ui v4 only
          size: 'small',
        }
      },

      renderExpandableRow: (rowData, { dataIndex }) => {
        const src = data[dataIndex]
        const colSpan = rowData.length + 1

        return (
          <TableRow className={classes.expandedRow}>
            <TableCell colSpan={colSpan}>
              <Paper style={{ padding: 16 }}>
                <ReactJson
                  theme={isDarkMode ? 'monokai' : undefined}
                  name="Withdrawal"
                  src={src}
                />
              </Paper>
            </TableCell>
          </TableRow>
        )
      },
    }),
    [data, isDarkMode],
  )

  const columns = React.useMemo(
    () => [
      {
        name: 'timestamp',
        label: 'Date',
        options: {
          customBodyRenderLite: dataIndex => {
            const date = createMoment(data[dataIndex].createdAt)
            return date.format('lll')
          },
          ...DateRangePickerFilter('Timestamp'),
        },
      },
      {
        name: 'plugin',
        label: 'Type',
        sort: false,

        options: {
          filter: true,
          display: true,
          customBodyRenderLite: dataIndex => {
            return data[dataIndex].plugin || data[dataIndex].provider || 'N/A'
          },
          customFilterListOptions: { render: val => `Type: ${val}` },
          filterOptions: {
            names: pluginList,
          },
        },
      },
      {
        name: 'totalValue',
        label: 'Amount',
        options: {
          filter: false,
          display: true,
          sort: false,
          customBodyRenderLite: dataIndex => {
            const amount = data[dataIndex].amount || data[dataIndex].totalValue
            return numeral(amount).format('$0,0.00')
          },
        },
      },
      {
        name: 'status',
        label: 'Status',
        options: {
          sort: false,
          filter: false,
        },
      },
      {
        name: 'viewTransaction',
        label: 'View Transaction',
        options: {
          sort: false,
          customBodyRender: (_, { rowIndex }) => {
            const { transactionId } = data[rowIndex]

            if (!transactionId) {
              return ''
            }

            return <ViewOnBlockchair hash={transactionId} />
          },
        },
      },
    ],
    [data],
  )

  const filterAssignments = [
    { key: 'createdAt', index: 0, dateRange: true },
    { key: 'plugin', index: 1 },
  ]

  return (
    <DataTable
      title="Withdrawals"
      data={data}
      columns={columns}
      options={options}
      exportUrl={`${env.API_URL}/admin/users/withdrawals/export?userId=${userData.user.id}`}
      serverSide={{
        setData,
        userId: userData.user.id,
        fetchUrl: 'admin/table/withdrawals',
        filters: filterAssignments,
      }}
      search={{
        label: 'Transaction ID',
        columns: ['transactionId'],
      }}
    />
  )
}
