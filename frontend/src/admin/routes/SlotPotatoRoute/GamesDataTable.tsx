import React from 'react'
import { useQuery } from '@apollo/client'
import { Button } from '@mui/material'
import { type MUIDataTableOptions } from 'mui-datatables'

import { DataTable } from 'mrooi'
import { TPGamesQuery, type TPGamesQueryData } from 'admin/gql'
import { type SlotPotatoGame } from 'admin/gql/slotPotato'

import { useSlotPotatoFormStyles } from './SlotPotatoForm.styles'

export interface GamesDataTableProps {
  sortAndSetSelectedGames: (selectedGames: SlotPotatoGame[]) => void
  setSelectedGames: (selectedGames: SlotPotatoGame[]) => void
  selectedGames: SlotPotatoGame[]
}

export const GamesDataTable: React.FC<GamesDataTableProps> = ({
  sortAndSetSelectedGames,
  setSelectedGames,
  selectedGames,
}) => {
  const classes = useSlotPotatoFormStyles()

  const { data: gameResponse, loading: gamesLoading } =
    useQuery<TPGamesQueryData>(TPGamesQuery, {
      onError: error => {
        console.error(error.message)
      },
    })

  const columns = React.useMemo(
    () => [
      {
        name: 'title',
        label: 'Title',
        options: {
          filter: false,
        },
      },
      {
        name: 'provider',
        label: 'Provider',
        options: {
          customFilterListOptions: { render: val => `Provider: ${val}` },
        },
      },
    ],
    [],
  )

  const tableOptions: MUIDataTableOptions = {
    download: false,
    print: false,
    selectableRows: 'multiple',
    filter: true,
    selectToolbarPlacement: 'above',
    customToolbarSelect: (selectedRows, displayData, setSelectedRows) => {
      if (!displayData.length || !selectedRows.data.length) {
        return null
      }

      // It is important to keep track of this dataIndex
      const selectedGamesMetaData = Object.keys(selectedRows.lookup).map(
        val => ({
          dataIndex: val,
          game: gameResponse?.tpGamesAdmin[val],
        }),
      )

      const handleSelectedGames = () =>
        // @ts-expect-error This is just broken. Slot potato games are not being set, so no order is accessible.
        sortAndSetSelectedGames(selectedGamesMetaData)

      return (
        <div>
          <Button
            className={classes.actionButtons}
            variant="contained"
            onClick={() => {
              setSelectedRows([])
              setSelectedGames([])
            }}
          >
            Clear Games
          </Button>
          <Button
            className={classes.actionButtons}
            color="primary"
            variant="contained"
            onClick={handleSelectedGames}
          >
            Update Games
          </Button>
        </div>
      )
    },
  }

  const tableSearch = {
    label: 'Search',
    columns: ['title', 'provider'],
  }

  if (gamesLoading) {
    return null
  }

  return (
    <DataTable
      search={tableSearch}
      data={gameResponse?.tpGamesAdmin ?? []}
      columns={columns}
      options={tableOptions}
    />
  )
}
