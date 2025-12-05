import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import MUIDataTable, {
  type MUIDataTableColumn,
  type MUIDataTableOptions,
} from 'mui-datatables'
import moment from 'moment'
import numeral from 'numeral'
import { Button, Tab, Tabs } from '@mui/material'

import { Loading, TitleContainer, DateRangePickerFilter } from 'mrooi'
import { useAxiosGet } from 'common/hooks'
import { type KOTH } from 'common/types'
import { sortBy } from 'common/util'

import { useListKOTHsRouteStyles } from './ListKOTHsRoute.styles'

const LIST_TABS = ['Active', 'Completed', 'Upcoming'] as const

export const ListKOTHsRoute: React.FC = () => {
  const history = useHistory()
  const classes = useListKOTHsRouteStyles()
  const [{ data, loading }] = useAxiosGet<KOTH[]>('/admin/koth/')
  const [tableViewTab, setTableViewTab] =
    useState<(typeof LIST_TABS)[number]>('Active')

  const KOTHS = React.useMemo(() => data ?? [], [data])

  const formattedKOTHS = React.useMemo(() => {
    const sortedKOTHS = KOTHS.sort(sortBy('startTime'))
    return sortedKOTHS.map(KOTH => ({
      _id: KOTH._id,
      startTime: moment(KOTH.startTime).utc().format('MM/DD/YY HH:mm'),
      endTime: moment(KOTH.endTime).utc().format('MM/DD/YY HH:mm'),
      whichRoo: KOTH.whichRoo,
      currentUserId: KOTH.currentUserId,
      earnings: KOTH.earnings ? numeral(KOTH.earnings).format('$0,0.00') : '',
      minBet:
        KOTH.whichRoo === 'astro'
          ? 'N/A'
          : numeral(KOTH.minBet).format('$0,0.00'),
      isActive: KOTH.isActive ? 'Yes' : 'No',
    }))
  }, [KOTHS])

  const getIsActiveFilterList = React.useCallback(() => {
    if (tableViewTab === 'Active') {
      return ['Yes']
    }

    if (tableViewTab === 'Completed') {
      return ['No']
    }

    return []
  }, [tableViewTab])

  const getUpcomingFilterList = React.useCallback(() => {
    if (tableViewTab === 'Upcoming') {
      return [
        {
          start: moment().toISOString(),
        },
      ]
    }
    return []
  }, [tableViewTab])

  const getCompletedFilterList = React.useCallback(() => {
    if (tableViewTab === 'Completed') {
      return [
        {
          end: moment().toISOString(),
        },
      ]
    }
  }, [tableViewTab])

  const columns = React.useMemo(
    (): MUIDataTableColumn[] => [
      {
        name: '_id',
        label: 'ID',
        options: {
          display: false,
          filter: false,
        },
      },
      {
        name: 'startTime',
        label: 'Starting',
        options: {
          ...DateRangePickerFilter(
            'Start Date',
            (start, [filters]) => {
              if (!filters) {
                return false
              }
              const before = filters.start
                ? moment(start, 'MM/DD/YY HH:mm').isAfter(moment(filters.start))
                : true
              const after = filters.end
                ? moment(start, 'MM/DD/YY HH:mm').isBefore(moment(filters.end))
                : true
              return !(before && after)
            },
            'MM/DD/YY HH:mm',
            false,
            getUpcomingFilterList(),
          ),
        },
      },
      {
        name: 'endTime',
        label: 'Ending',
        options: {
          ...DateRangePickerFilter(
            'End Date',
            (end, [filters]) => {
              if (!filters) {
                return false
              }
              const before = filters.start
                ? moment(end, 'MM/DD/YY HH:mm').isAfter(moment(filters.start))
                : true
              const after = filters.end
                ? moment(end, 'MM/DD/YY HH:mm').isBefore(moment(filters.end))
                : true
              return !(before && after)
            },
            'MM/DD/YY HH:mm',
            false,
            getCompletedFilterList(),
          ),
        },
      },
      {
        name: 'whichRoo',
        label: 'Flavor',
        options: {
          filter: true,
        },
      },
      {
        name: 'minBet',
        label: 'Min. Bet',
        options: {
          filter: false,
        },
      },
      {
        name: 'currentUserId',
        label: 'Current King',
        options: {
          filter: false,
        },
      },
      {
        name: 'earnings',
        label: 'Earnings',
        options: {
          filter: false,
        },
      },
      {
        name: 'isActive',
        label: 'Active',
        options: {
          display: false,
          filterList: getIsActiveFilterList(),
          customFilterListOptions: { render: val => `Active: ${val}` },
        },
      },
    ],
    [getIsActiveFilterList, getUpcomingFilterList, getCompletedFilterList],
  )

  const options: MUIDataTableOptions = {
    print: false,
    viewColumns: false,
    download: false,
    search: false,
    selectableRows: 'single',
    customToolbarSelect: (selectedRows, displayData) => {
      if (!displayData.length || !selectedRows.data.length) {
        return null
      }

      const selectedRowIndex = selectedRows.data[0].index
      const dataArray = displayData[selectedRowIndex].data
      const id = dataArray[0]

      const row = KOTHS.find(KOTH => KOTH._id === id)

      if (!row) {
        return null
      }

      return (
        <div>
          <Button
            className={classes.ListKOTHActions_addMargin}
            color="primary"
            variant="contained"
            onClick={() => history.push(`/crm/koths/${row._id}/edit`)}
          >
            Edit
          </Button>
        </div>
      )
    },
  }

  return (
    <TitleContainer
      title="KOTHs"
      returnTo={undefined}
      actions={() => [
        {
          value: 'Create KOTH',
          variant: 'contained',
          onClick: () => history.push('/crm/koths/create'),
        },
      ]}
    >
      <Tabs
        classes={{ root: classes.ListKOTH_addMarginBot }}
        indicatorColor="primary"
        value={tableViewTab}
        onChange={(_, newTab) => {
          setTableViewTab(newTab)
        }}
      >
        {LIST_TABS.map(tab => (
          <Tab key={tab} value={tab} label={tab} />
        ))}
      </Tabs>
      {loading ? (
        <Loading />
      ) : (
        <MUIDataTable
          title=""
          columns={columns}
          data={formattedKOTHS}
          options={options}
        />
      )}
    </TitleContainer>
  )
}
