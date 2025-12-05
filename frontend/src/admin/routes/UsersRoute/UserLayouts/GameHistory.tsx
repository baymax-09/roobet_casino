import React from 'react'
import { TableRow, TableCell, Paper } from '@mui/material'
import ReactJson from 'react-json-view'

import { DataTable, DateRangePickerFilter } from 'mrooi'
import { createMoment } from 'common/util/date'
import { useDarkMode } from 'admin/context'
import { HOUSE_GAMES_WITH_HISTORY } from 'common/types'

import { type UserData } from '../types'

import { useBetsStyles } from './Bets.styles'

interface GameHistoryLayoutProps {
  userData: UserData
}

interface GameHistoryData {
  createdAt: string
}

export const GameHistoryLayout: React.FC<GameHistoryLayoutProps> = ({
  userData,
}) => {
  const classes = useBetsStyles()
  const [isDarkMode] = useDarkMode()

  const [data, setData] = React.useState<GameHistoryData[]>([])

  const filterAssignments = [
    { key: 'createdAt', index: 1, dateTimeRange: true },
    { key: 'gameName', index: 2 },
  ]

  const options = React.useMemo(
    () => ({
      expandableRows: true,
      expandableRowsHeader: false,
      expandableRowsOnClick: true,
      filter: true,
      filterList: [[], [], []],
      pagination: true,
      setTableProps: () => {
        return {
          size: 'small',
        }
      },
      renderExpandableRow: (rowData, { dataIndex }) => {
        const roundHistory = data[dataIndex]
        const colSpan = rowData.length + 1

        return (
          <TableRow className={classes.expandedRow}>
            <TableCell colSpan={colSpan}>
              <Paper style={{ padding: 16 }}>
                <ReactJson
                  theme={isDarkMode ? 'monokai' : undefined}
                  name="Game History"
                  src={roundHistory}
                />
              </Paper>
            </TableCell>
          </TableRow>
        )
      },
    }),
    [data],
  )

  const columns = React.useMemo(
    () => [
      {
        name: '_id',
        label: 'ID',
        options: {
          filter: false,
          display: true,
        },
      },
      {
        name: 'createdAt',
        label: 'Date',
        options: {
          sort: true,
          customBodyRenderLite: dataIndex => {
            const date = createMoment(data[dataIndex].createdAt)
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
        name: 'gameName',
        label: 'Game',
        options: {
          filter: true,
          sort: false,
          display: true,
          filterOptions: {
            names: [...HOUSE_GAMES_WITH_HISTORY],
          },
        },
      },
    ],
    [data],
  )

  return (
    <DataTable
      title="Game History"
      data={data}
      columns={columns}
      options={options}
      serverSide={{
        setData,
        fetchUrl: 'game/admin/gamehistory',
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
