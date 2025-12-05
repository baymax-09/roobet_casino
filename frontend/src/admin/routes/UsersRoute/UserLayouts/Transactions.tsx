import React from 'react'
import clsx from 'clsx'
import { TableRow, TableCell, Link, Paper } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import numeral from 'numeral'
import ReactJson from 'react-json-view'
import { type MUIDataTableColumn } from 'mui-datatables'

import { DataTable, DateRangePickerFilter } from 'mrooi'
import { createMoment, getShortFromBalanceType } from 'common/util'
import { DebouncedTextField } from 'admin/components'
import { env } from 'common/constants'
import { useDarkMode } from 'admin/context'
import {
  type BalanceType,
  balanceTypeToFullname,
  isPortfolioBalanceType,
} from 'common/types'

import { type UserData } from '../types'

import { useTransactionsStyles } from './Transactions.styles'

interface TransactionUserLayoutProps {
  userData: UserData
}

interface TransactionData {
  timestamp: string
  // this being partial is not correct, just not important enough to duplicate the discriminated union from backend right now
  meta: {
    fromName?: string
    gameName?: string
    providerBetId?: string
  }
  amount: number
  balanceType: BalanceType
  userId: string
  currentBalance: number
  currentEthBalance: number
  currentLtcBalance: number
  currentCashBalance: number
  currentAltcoinBalances: object
}

const TransactionUserLayoutView: React.FC<TransactionUserLayoutProps> = ({
  userData,
}) => {
  const classes = useTransactionsStyles()
  const [isDarkMode] = useDarkMode()

  const [data, setData] = React.useState<TransactionData[]>([])

  const options = React.useMemo(
    () => ({
      expandableRows: true,
      expandableRowsHeader: false,
      expandableRowsOnClick: true,
      filter: true,
      setTableProps: () => {
        return {
          size: 'small',
        }
      },

      renderExpandableRow: (rowData, { dataIndex }) => {
        const bet = data[dataIndex]
        const colSpan = rowData.length + 1

        return (
          <TableRow className={classes.expandedRow}>
            <TableCell colSpan={colSpan}>
              <Paper style={{ padding: 16 }}>
                <ReactJson
                  theme={isDarkMode ? 'monokai' : undefined}
                  name="Transaction"
                  src={bet}
                />
              </Paper>
            </TableCell>
          </TableRow>
        )
      },
    }),
    [data],
  )

  const filterAssignments = [
    { key: 'timestamp', index: 0, dateRange: true },
    { key: 'type', index: 2 },
    { key: 'meta.fromName', index: 3 },
    { key: 'balanceType', index: 6 },
    { key: 'meta.providerBetId', index: 9 },
  ]

  const columns: MUIDataTableColumn[] = React.useMemo(
    () => [
      {
        name: 'timestamp',
        label: 'Date',
        options: {
          customBodyRenderLite: dataIndex => {
            const date = createMoment(data[dataIndex].timestamp)
            return date.format('lll')
          },
          ...DateRangePickerFilter('Date'),
        },
      },
      {
        name: '_id',
        label: 'ID',
        options: {
          filter: false,
          filterType: 'textField',
          display: false,
        },
      },
      {
        name: 'type',
        label: 'Type',
        sort: false,

        options: {
          filter: true,
          filterType: 'multiselect',
          filterOptions: {
            names: [
              'adminAddBalance',
              'adminSetBalance',
              'affiliate',
              'bet',
              'bonus',
              'cancelledWithdrawal',
              'deposit',
              'koth',
              'marketingBonus',
              'matchPromo',
              'payout',
              'prizeDrop',
              'promo',
              'rain',
              'rakeback',
              'refund',
              'roowards',
              'survey',
              'tip',
              'withdrawal',
            ],
          },
          display: true,
        },
      },
      {
        name: 'meta',
        label: 'Tip From',
        options: {
          display: false,
          filter: true,
          filterType: 'custom',
          customBodyRenderLite: dataIndex => {
            return <span>{data[dataIndex].meta.fromName}</span>
          },
          customFilterListOptions: {
            render: tip => `Tip From: ${tip}`,
            update: (filterList, _, index) => {
              filterList[index] = []
              return filterList
            },
          },
          filterOptions: {
            display: (filterList, onChange, index, column) => {
              if (!filterList[2].includes('tip')) {
                return null
              }
              return (
                <DebouncedTextField
                  placeholder="Tip From"
                  filterList={filterList}
                  onChange={onChange}
                  index={index}
                  column={column}
                />
              )
            },
          },
        },
      },
      {
        name: 'amount',
        label: 'Amount',
        options: {
          filter: false,
          customBodyRenderLite: dataIndex => {
            return (
              <span
                className={clsx(classes.profit, {
                  [classes.negative]: data[dataIndex].amount < 0,
                  [classes.positive]: data[dataIndex].amount > 0,
                })}
              >
                {numeral(data[dataIndex].amount).format(
                  data[dataIndex].amount >= 1 ? '$0,0.00' : '$0,0.00[0000]',
                )}
              </span>
            )
          },
        },
      },
      {
        name: 'game',
        label: 'Game',
        options: {
          filter: false,
          display: false,
          sort: false,
          customBodyRenderLite: dataIndex => {
            return data[dataIndex].meta?.gameName || '-'
          },
        },
      },
      {
        name: 'balanceType',
        label: 'Balance Type',
        options: {
          filter: true,
          sort: false,
          customBodyRenderLite: dataIndex => {
            const val = data[dataIndex].balanceType
            return balanceTypeToFullname[val] ?? val
          },
          customFilterListOptions: { render: val => `Balance Type: ${val}` },
          filterOptions: {
            names: Object.keys(balanceTypeToFullname),
            renderValue: val => balanceTypeToFullname[val],
          },
        },
      },
      {
        label: 'User ID',
        name: 'userId',
        options: {
          filter: false,
          display: false,
          filterType: 'textField',
          customBodyRenderLite: dataIndex => {
            const userId = data[dataIndex].userId
            return (
              <Link
                component={RouterLink}
                className={classes.userLink}
                to={`/users?expanded=toggles&userId=${userId}`}
                target="_blank"
                underline="hover"
              >
                {userId}
              </Link>
            )
          },
        },
      },
      {
        name: 'currentBalance',
        label: 'Balance',
        options: {
          filter: false,
          sort: false,
          customBodyRenderLite: dataIndex => {
            const balanceType = data[dataIndex].balanceType
            let val
            if (balanceType === 'crypto') {
              val = data[dataIndex].currentBalance
            }
            if (balanceType === 'eth') {
              val = data[dataIndex].currentEthBalance
            }
            if (balanceType === 'ltc') {
              val = data[dataIndex].currentLtcBalance
            }
            if (balanceType === 'cash') {
              val = data[dataIndex].currentCashBalance
            }
            if (isPortfolioBalanceType(balanceType)) {
              val = data[dataIndex].currentAltcoinBalances[balanceType]
            }
            return (
              numeral(val).format(val >= 1 ? '$0,0.00' : '$0,0.00[0000]') +
              ` ${getShortFromBalanceType(data[dataIndex].balanceType)}`
            )
          },
        },
      },
      {
        name: 'providerBetId',
        label: 'Betslip ID',
        options: {
          filter: true,
          filterOptions: { fullWidth: true },
          filterType: 'textField',
          display: false,
          customBodyRenderLite: dataIndex => {
            return data[dataIndex].meta?.providerBetId || '-'
          },
        },
      },
    ],
    [data],
  )

  return (
    <DataTable
      title="Transactions"
      data={data}
      columns={columns}
      options={options}
      exportUrl={`${env.API_URL}/admin/users/transactions/export?userId=${userData.user.id}`}
      serverSide={{
        setData,
        fetchUrl: 'admin/table/transactions',
        userId: userData.user.id,
        filters: filterAssignments,
      }}
      search={{
        label: 'Transaction ID',
        columns: ['_id'],
      }}
    />
  )
}

export const TransactionUserLayout = React.memo(TransactionUserLayoutView)
