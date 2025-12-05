import React from 'react'
import clsx from 'clsx'
import { TableRow, TableCell, Link, Paper } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import numeral from 'numeral'
import ReactJson from 'react-json-view'
import { type MUIDataTableColumn } from 'mui-datatables'

import { DataTable, DateRangePickerFilter } from 'mrooi'
import { createMoment } from 'common/util/date'
import { env } from 'common/constants'
import { useDarkMode } from 'admin/context'
import { HOUSE_GAMES, type User } from 'common/types'

import { type UserData } from '../types'

import { useBetsStyles } from './Bets.styles'

interface BetsUserLayoutProps {
  userData: UserData
}

// This type might be a little inaccurate
interface BetsData {
  timestamp: string
  betAmount: number
  gameNameDisplay?: string
  gameName: string
  user: User
  userId: string
  highroller: boolean
  won: boolean
  closedOut: boolean
  payoutMultiplier: number
  profit: number
  autobet: boolean
}

export const BetsUserLayout: React.FC<BetsUserLayoutProps> = ({ userData }) => {
  const classes = useBetsStyles()
  const [isDarkMode] = useDarkMode()

  const [data, setData] = React.useState<BetsData[]>([])

  const filterAssignments = [
    { key: 'timestamp', index: 1, dateTimeRange: true },
    { key: 'gameName', index: 3 },
    { key: 'roundId', index: 11 },
    { key: 'gameSessionId', index: 12 },
    { key: 'autobet', index: 13, exists: true },
  ]

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
                  name="Bet"
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

  const columns: MUIDataTableColumn[] = React.useMemo(
    () => [
      {
        name: '_id',
        label: 'ID',
        options: {
          filter: false,
          display: false,
        },
      },
      {
        name: 'timestamp',
        label: 'Date',
        options: {
          sort: true,
          customBodyRenderLite: dataIndex => {
            const date = createMoment(data[dataIndex].timestamp)
            return date.format('lll')
          },
          ...DateRangePickerFilter(
            'Timestamp',
            (value, filters) => {
              if (filters.length > 0) {
                const { start, end } = filters[0]
                if (start && end) {
                  return !(value >= start && value <= end)
                }
              }
              return false
            },
            'lll',
          ),
        },
      },
      {
        name: 'betAmount',
        label: 'Bet Amount',
        options: {
          filter: false,
          customBodyRenderLite: dataIndex => {
            return numeral(data[dataIndex].betAmount).format(
              data[dataIndex].betAmount >= 1 ? '$0,0.00' : '$0,0.00[0000]',
            )
          },
        },
      },
      {
        name: 'game',
        label: 'Game',
        options: {
          filter: true,
          sort: false,
          filterOptions: {
            names: [
              ...HOUSE_GAMES,
              'hub88',
              'softswiss',
              'pragmatic',
              'redtiger',
              'playngo',
              'hacksaw',
              'sportsbook',
            ],
          },
          customBodyRenderLite: dataIndex => {
            return (
              <span className={classes.gameName}>
                {data[dataIndex].gameNameDisplay ?? data[dataIndex].gameName}
              </span>
            )
          },
        },
      },
      {
        name: 'userID',
        label: 'User ID',
        options: {
          filter: false,
          filterType: 'textField',
          display: false,
          customBodyRenderLite: dataIndex => {
            return data[dataIndex].userId
          },
        },
      },
      {
        label: 'User',
        name: 'user',
        options: {
          filter: false,
          display: false,
          customBodyRenderLite: dataIndex => {
            const user = data[dataIndex].user
            const userId = data[dataIndex].userId
            return (
              <Link
                component={RouterLink}
                className={classes.userLink}
                to={`/users?expanded=toggles&userId=${userId}`}
                target="_blank"
                underline="hover"
              >
                {user?.name || userId}
              </Link>
            )
          },
        },
      },
      {
        name: 'highroller',
        label: 'Highroller',
        options: {
          filter: false,
          display: false,
          sort: false,
          customBodyRenderLite: dataIndex => {
            return data[dataIndex].highroller ? 'Highroller' : 'Regular'
          },
        },
      },
      {
        name: 'state',
        label: 'State',
        options: {
          filter: false,
          display: false,
          sort: false,
          customBodyRenderLite: dataIndex => {
            return data[dataIndex].won ? 'Won' : 'Lost'
          },
        },
      },
      {
        name: 'closedOut',
        label: 'Closed Out',
        options: {
          filter: false,
          display: false,
          sort: false,
          customBodyRenderLite: dataIndex => {
            return data[dataIndex].closedOut ? 'Open' : 'Closed Out'
          },
        },
      },
      {
        name: 'profit',
        label: 'Profit',
        options: {
          filter: false,
          customBodyRenderLite: dataIndex => {
            return (
              <span
                className={clsx(classes.profit, {
                  [classes.negative]: data[dataIndex].profit < 0,
                  [classes.positive]: data[dataIndex].profit > 0,
                })}
              >
                {numeral(data[dataIndex].profit).format(
                  data[dataIndex].profit >= 1 ? '$0,0.00' : '$0,0.00[0000]',
                )}
              </span>
            )
          },
        },
      },
      {
        name: 'payoutMultiplier',
        label: 'Payout Multiplier',
        options: {
          filter: false,
          display: false,
          sort: false,
          customBodyRenderLite: dataIndex => {
            return (
              numeral(data[dataIndex].payoutMultiplier).format('0,0.00') + 'x'
            )
          },
        },
      },
      {
        name: 'roundId',
        label: 'Round ID',
        options: {
          filter: true,
          display: false,
          sort: false,
        },
      },
      {
        name: 'gameSessionId',
        label: 'Game Session ID',
        options: {
          filter: true,
          display: false,
          sort: false,
        },
      },
      {
        name: 'autobet',
        label: 'Autobet',
        options: {
          display: false,
          filter: true,
          sort: false,
          filterType: 'dropdown',
          filterOptions: {
            names: ['Yes', 'No'],
          },
          customBodyRenderLite: dataIndex =>
            data[dataIndex].autobet ? 'Yes' : 'No',
        },
      },
    ],
    [data],
  )

  return (
    <DataTable
      title="Bets"
      data={data}
      columns={columns}
      options={options}
      exportUrl={`${env.API_URL}/admin/users/bets/export?userId=${userData.user.id}`}
      serverSide={{
        setData,
        fetchUrl: 'admin/table/bets',
        userId: userData.user.id,
        filters: filterAssignments,
      }}
      search={{
        label: 'Bet ID',
        columns: ['_id'],
      }}
    />
  )
}
