import React, { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Button, Tab, Tabs } from '@mui/material'
import moment from 'moment'
import MUIDataTable, {
  type MUIDataTableOptions,
  type MUIDataTableColumn,
} from 'mui-datatables'
import { useHistory } from 'react-router-dom'

import {
  SlotPotatoQuery,
  type SlotPotatoQueryResponse,
  type SlotPotato,
  SlotPotatoDisableMutation,
  SlotPotatoEnableMutation,
} from 'admin/gql/slotPotato'
import { DateRangePickerFilter, Loading, TitleContainer } from 'mrooi'
import { useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'
import { useAccessControl } from 'admin/hooks'

import { useListSlotPotatoRouteStyles } from './ListSlotPotatoRoute.styles'

function updateSlotPotatoCache(
  cache,
  updatedSlotPotatoFromResponse?: SlotPotato,
) {
  const existingSlotPotatoes: SlotPotatoQueryResponse | null = cache.readQuery({
    query: SlotPotatoQuery,
  })

  if (!existingSlotPotatoes || !updatedSlotPotatoFromResponse) {
    console.error('useMutation - No existing slot potatoes')
    return
  }

  cache.writeQuery({
    query: SlotPotatoQuery,
    data: {
      slotPotatoes: existingSlotPotatoes.slotPotatoes.map(sp => {
        if (sp.id === updatedSlotPotatoFromResponse.id) {
          return updatedSlotPotatoFromResponse
        }

        return sp
      }),
    },
  })
}

const UpdateButtonActions = withRulesAccessController(
  ['slot_potato:update'],
  Button,
)
const DisableButtonActions = withRulesAccessController(
  ['slot_potato:update'],
  Button,
)

const LIST_TABS = ['Active', 'Completed', 'Upcoming', 'Disabled'] as const

export const ListSlotPotatoRoute: React.FC = () => {
  const classes = useListSlotPotatoRouteStyles()
  const { toast } = useToasts()
  const history = useHistory()
  const [tableViewTab, setTableViewTab] =
    useState<(typeof LIST_TABS)[number]>('Active')
  const { hasAccess: hasSlotPotatoAccess } = useAccessControl([
    'slot_potato:read',
  ])

  const [slotPotatoDisable] = useMutation(SlotPotatoDisableMutation, {
    onError: ({ message }) => {
      toast.error(message)
    },
    onCompleted: () => {
      toast.success('Slot Potato Disabled')
    },
    update: (cache, { data }) =>
      updateSlotPotatoCache(cache, data?.slotPotatoDisable),
  })

  const [slotPotatoEnable] = useMutation(SlotPotatoEnableMutation, {
    onError: ({ message }) => {
      toast.error(message)
    },
    onCompleted: () => {
      toast.success('Slot Potato Enabled')
    },
    update: (cache, { data }) =>
      updateSlotPotatoCache(cache, data?.slotPotatoEnable),
  })

  const { data: slotPotatoQueryData = { slotPotatoes: [] }, loading } =
    useQuery<SlotPotatoQueryResponse>(SlotPotatoQuery, {
      onError: error => {
        console.error(error.message)
      },
    })

  const disableSlotPotato = (row, setSelectedRows) => {
    const slotPotatoToUpdate = slotPotatoQueryData.slotPotatoes.find(
      sp => sp.id === row.id,
    )

    if (!slotPotatoToUpdate) {
      toast.error('disableSlotPotato - No slot potato to update')
      return
    }

    const payload = {
      variables: {
        data: {
          id: slotPotatoToUpdate.id,
        },
      },
    }

    if (slotPotatoToUpdate.disabled) {
      slotPotatoEnable(payload)
    } else {
      slotPotatoDisable(payload)
    }

    setSelectedRows([])
  }

  const potatoes = React.useMemo(
    () => slotPotatoQueryData?.slotPotatoes ?? [],
    [slotPotatoQueryData],
  )

  const formattedPotatoes = React.useMemo(() => {
    return potatoes.map(slotPotato => ({
      id: slotPotato.id,
      isActive: slotPotato.isActive ? 'Yes' : 'No',
      disabled: slotPotato.disabled ? 'Yes' : 'No',
      games: slotPotato.games.length,
      gameDuration: slotPotato.gameDuration / 60000,
      start: moment(slotPotato.startDateTime).utc().format('MM/DD/YY HH:mm'),
      end: moment(slotPotato.endDateTime).utc().format('MM/DD/YY HH:mm'),
    }))
  }, [potatoes])

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
    return []
  }, [tableViewTab])

  const getDisabledFilterList = React.useCallback(() => {
    if (tableViewTab === 'Active' || tableViewTab === 'Completed') {
      return ['No']
    }
    if (tableViewTab === 'Disabled') {
      return ['Yes']
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
      {
        name: 'disabled',
        label: 'Disabled',
        options: {
          filterList: getDisabledFilterList(),
          customFilterListOptions: { render: val => `Disabled: ${val}` },
        },
      },
      {
        name: 'games',
        label: 'Game Count',
        options: {
          customFilterListOptions: { render: val => `Game Count: ${val}` },
        },
      },
      {
        name: 'gameDuration',
        label: 'Game Duration',
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
            getCompletedFilterList(),
          ),
        },
      },
    ],
    [
      getIsActiveFilterList,
      getUpcomingFilterList,
      getCompletedFilterList,
      getDisabledFilterList,
    ],
  )

  const tableOptions: MUIDataTableOptions = {
    print: false,
    selectableRows: 'single',
    filter: true,
    customToolbarSelect: (selectedRows, displayData, setSelectedRows) => {
      if (!displayData.length || !selectedRows.data.length) {
        return null
      }

      const selectedRowIndex = selectedRows.data[0].index
      const dataArray = displayData[selectedRowIndex].data
      const id = dataArray[0]
      const row = slotPotatoQueryData?.slotPotatoes.find(sp => sp.id === id)
      const disableSlotPotatoButtonText = row?.disabled ? 'Enable' : 'Disable'

      const handleEditClick = () =>
        history.push(`/crm/slot-potato/${row?.id}/edit`)
      const handleSlotPotatoStatus = () =>
        disableSlotPotato(row, setSelectedRows)

      return (
        <div>
          <UpdateButtonActions
            className={classes.ListPotatoActions_addMargin}
            color="primary"
            variant="contained"
            onClick={handleEditClick}
          >
            Edit
          </UpdateButtonActions>
          <DisableButtonActions
            className={classes.ListPotatoActions_addMargin}
            color="primary"
            variant="contained"
            onClick={handleSlotPotatoStatus}
          >
            {disableSlotPotatoButtonText}
          </DisableButtonActions>
        </div>
      )
    },
  }

  if (!hasSlotPotatoAccess) {
    return null
  }

  return (
    <TitleContainer
      title="Slot Potatoes"
      returnTo={undefined}
      actions={() => [
        {
          value: 'New Slot Potato',
          variant: 'contained',
          onClick: () => history.push('/crm/slot-potato/create'),
        },
      ]}
    >
      <Tabs
        className={classes.ListPotatoes_addMarginBot}
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
          data={formattedPotatoes}
          options={tableOptions}
        />
      )}
    </TitleContainer>
  )
}
