import React, { useState } from 'react'
import MUIDataTable, {
  type MUIDataTableOptions,
  type MUIDataTableColumn,
} from 'mui-datatables'
import { Button, Tab, Tabs } from '@mui/material'
import moment from 'moment'
import numeral from 'numeral'
import { useHistory } from 'react-router-dom'

import { DateRangePickerFilter, Loading, TitleContainer } from 'mrooi'
import { useAxiosGet, useToasts } from 'common/hooks'
import { sortBy, api } from 'common/util'
import { type Raffle } from 'common/types'

import { useListRafflesRouteStyles } from './ListRafflesRoute.styles'

const LIST_TABS = ['Active', 'Completed', 'Upcoming', 'Archived'] as const

export const ListRafflesRoute: React.FC = () => {
  const classes = useListRafflesRouteStyles()
  const history = useHistory()
  const { toast } = useToasts()

  const [tableViewTab, setTableViewTab] =
    useState<(typeof LIST_TABS)[number]>('Active')

  const [{ data, loading }, reloadRaffles] = useAxiosGet<{ raffles: Raffle[] }>(
    '/admin/raffle',
    {
      onError: err => toast.error(err.response.data),
    },
  )

  const archiveRaffle = async (row, setSelectedRows) => {
    try {
      setSelectedRows([])

      const { raffle } = await api.patch<any, { raffle: Raffle }>(
        `/raffle/${row.id}`,
        {
          archived: !row.archived,
        },
      )

      reloadRaffles()

      toast.success(raffle.archived ? 'Archived raffle.' : 'Unarchived raffle.')
    } catch (err: any) {
      toast.error(err?.message ?? 'An unknown error occurred.')
    }
  }

  const raffles = React.useMemo(() => data?.raffles ?? [], [data])

  const formattedRaffles = React.useMemo(() => {
    const sortedRaffles = raffles.sort(sortBy('archived'))

    return sortedRaffles.map(raffle => ({
      id: raffle.id,
      name: raffle.name,
      slug: raffle.slug,
      isActive: raffle.isActive ? 'Yes' : 'No',
      archived: raffle.archived ? 'Yes' : 'No',
      start: moment(raffle.start).utc().format('MM/DD/YY HH:mm'),
      end: moment(raffle.end).utc().format('MM/DD/YY HH:mm'),
      type: raffle.type,
      winnerCount: raffle.winnerCount,
      amount: numeral(raffle.amount).format('$0,0.00'),
    }))
  }, [raffles])

  const getIsActiveFilterList = React.useCallback(() => {
    if (tableViewTab === 'Active') {
      return ['Yes']
    }

    if (tableViewTab === 'Completed') {
      return ['No']
    }

    return []
  }, [tableViewTab])

  const getArchivedFilterList = React.useCallback(() => {
    if (tableViewTab === 'Active' || tableViewTab === 'Completed') {
      return ['No']
    }

    if (tableViewTab === 'Archived') {
      return ['Yes']
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

  const columns = React.useMemo(
    (): MUIDataTableColumn[] => [
      {
        name: 'id',
        label: 'ID',
        options: {
          display: false,
          filterList: [],
          customFilterListOptions: { render: val => `ID: ${val}` },
        },
      },
      {
        name: 'name',
        label: 'Name',
        options: {
          customFilterListOptions: { render: val => `Name: ${val}` },
        },
      },
      {
        name: 'slug',
        label: 'Slug',
        options: {
          customFilterListOptions: { render: val => `Slug: ${val}` },
        },
      },
      {
        name: 'isActive',
        label: 'Active',
        options: {
          filterList: getIsActiveFilterList(),
          customFilterListOptions: { render: val => `Active: ${val}` },
        },
      },
      {
        name: 'archived',
        label: 'Archived',
        options: {
          filterList: getArchivedFilterList(),
          customFilterListOptions: { render: val => `Archived: ${val}` },
        },
      },
      {
        label: 'Start Date',
        name: 'start',
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
        name: 'end',
        label: 'End Date',
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
          ),
        },
      },
      {
        name: 'type',
        label: 'Type',
        options: {
          customFilterListOptions: { render: val => `Type: ${val}` },
        },
      },
      {
        name: 'winnerCount',
        label: 'Winner Count',
        options: {
          customFilterListOptions: { render: val => `Winner Count: ${val}` },
        },
      },
      {
        name: 'amount',
        label: 'Amount',
        options: {
          customFilterListOptions: { render: val => `Amount: ${val}` },
        },
      },
    ],
    [getIsActiveFilterList, getArchivedFilterList, getUpcomingFilterList],
  )

  const options: MUIDataTableOptions = {
    print: false,
    selectableRows: 'single',
    downloadOptions: {
      filename: 'raffles.csv',
      filterOptions: {
        useDisplayedColumnsOnly: true,
        useDisplayedRowsOnly: true,
      },
    },
    customToolbarSelect: (selectedRows, displayData, setSelectedRows) => {
      if (!displayData.length || !selectedRows.data.length) {
        return null
      }

      const selectedRowIndex = selectedRows.data[0].index
      const dataArray = displayData[selectedRowIndex].data
      const id = dataArray[0]

      const row = raffles.find(raffle => raffle._id === id)

      if (!row) {
        return null
      }

      return (
        <div>
          <Button
            className={classes.actionButtons}
            color="primary"
            variant="contained"
            onClick={() => history.push(`/crm/raffles/${row._id}/edit`)}
          >
            Edit
          </Button>
          <Button
            className={classes.actionButtons}
            color="primary"
            variant="contained"
            onClick={() => archiveRaffle(row, setSelectedRows)}
          >
            {row.archived ? 'Unarchive' : 'Archive'}
          </Button>
        </div>
      )
    },
  }

  return (
    <TitleContainer
      title="Raffles"
      returnTo={undefined}
      actions={() => [
        {
          value: 'New Raffle',
          variant: 'contained',
          onClick: () => history.push('/crm/raffles/create'),
        },
      ]}
    >
      <Tabs
        className={classes.tabs}
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
          data={formattedRaffles}
          options={options}
        />
      )}
    </TitleContainer>
  )
}
