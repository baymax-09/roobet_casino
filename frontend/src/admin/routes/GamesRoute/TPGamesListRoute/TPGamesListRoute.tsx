import React from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { Button } from '@mui/material'
import {
  type MUIDataTableOptions,
  type MUIDataTableColumn,
} from 'mui-datatables'

import {
  GameTagsNotCachedQuery,
  TPGameStatusUpdate,
  TPGameMetadataQuery,
  TPGameAdminPaginatedQuery,
} from 'admin/gql'
import { useConfirm, useToasts } from 'common/hooks'
import { DataTable, Loading } from 'mrooi'
import { withRulesAccessController } from 'admin/components'
import { type TPGame, type GameTag } from 'common/types'

import { TPGameEditDialog } from '../TPGamesEditRoute'
import { TPUpdateGameCategoriesDialog } from '../TPGamesEditRoute/TPUpdateGamesCategoriesDialog'

import { useListGamesRouteStyles } from './TPGamesList.styles'

const EditTPGameButton = withRulesAccessController(['tpgames:update'], Button)
const ReadTPGameDatatable = withRulesAccessController(
  ['tpgames:read'],
  DataTable,
)

const TPGameUpdateDialog = withRulesAccessController(
  ['tpgames:update'],
  TPGameEditDialog,
)

const TPGameCategoryDialog = withRulesAccessController(
  ['tpgames:update'],
  TPUpdateGameCategoriesDialog,
)

interface TableState {
  searchText?: string
  filterList?: string[]
  page?: number
}

export const TPGamesListRoute: React.FC = () => {
  const [data, setData] = React.useState<TPGame[]>([])
  const [editDialogOpen, setEditDialogOpen] = React.useState<boolean>(false)
  const [categoryDialogOpen, setCategoryDialogOpen] =
    React.useState<boolean>(false)
  const [gamesToUpdate, setGamesToUpdate] = React.useState<string[]>([])
  const [gameIdentifier, setGameIdentifier] = React.useState('')
  const [isFirstLoad, setIsFirstLoad] = React.useState<boolean>(true)
  const [currentFilterObj, setCurrentFilterObj] = React.useState({})
  const currentPageRef = React.useRef(0)
  const classes = useListGamesRouteStyles()
  const { toast } = useToasts()
  const confirm = useConfirm()

  const handlePageChange = page => {
    currentPageRef.current = page
  }

  const { data: tagResponse } = useQuery(GameTagsNotCachedQuery, {
    onError: error => {
      toast.error(error.message)
    },
  })

  const { gameTagsNotCached } = tagResponse || {}
  const tags = gameTagsNotCached || []
  const tagNames = Object.values(tags as GameTag[])

  const [updateGameStatusMutation] = useMutation(TPGameStatusUpdate, {
    onCompleted: () => {
      toast.success(`Updated approval state for games.`)
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const { data: TPGameMetadata, refetch: refetchMetadata } = useQuery(
    TPGameMetadataQuery,
    {
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  const { tpGameMetadata } = TPGameMetadata || {}
  const { categories, aggregators, providers } = tpGameMetadata || {}
  const categoryNames = categories || []
  const aggregatorNames = aggregators || []
  const providerNames = providers || []
  const gameStatus = ['declined', 'pending', 'approved']

  const gameStatusOptions: Array<{ key: any; value: any }> = gameStatus.map(
    option => ({
      key: option,
      value: option,
    }),
  )

  const updateApprovalStatus = async games => {
    try {
      const result: { updatedStatus: string } = await confirm({
        title: `Update Approval Status`,
        message: `Update game status of ${games.length} games`,
        inputs: [
          {
            type: 'select',
            key: 'updatedStatus',
            name: 'Update Status',
            options: gameStatusOptions,
            required: true,
          },
        ],
      })
      await updateGameStatusMutation({
        variables: {
          input: {
            gameIdentifiers: games,
            approvalStatus: result.updatedStatus,
          },
        },
      })
      handleUpdateCompleted()
    } catch {}
  }

  const handleUpdateCompleted = () => {
    onFetch({}, { page: currentPageRef.current }).catch(error => {
      toast.error('Error Updating Games Table:', error)
    })
    refetchMetadata()
  }

  const [options, setOptions] = React.useState<MUIDataTableOptions>({
    filter: true,
    selectableRows: 'multiple',
    search: true,
    serverSide: true,
    count: 0,
    onChangePage: page => handlePageChange(page),
  })

  const { refetch: refetchData } = useQuery(TPGameAdminPaginatedQuery, {})

  React.useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false)
    }
  }, [isFirstLoad])

  const columns = React.useMemo(
    (): MUIDataTableColumn[] => [
      {
        name: 'identifier',
        label: 'Identifier',
        options: {
          filter: false,
          display: false,
        },
      },
      {
        label: 'Title',
        name: 'title',
        options: {
          filter: false,
          sort: true,
        },
      },
      {
        label: 'RTP',
        name: 'payout',
        options: {
          filter: false,
          sort: false,
          customBodyRender: (_, { rowData }) => {
            if (rowData[2]) {
              return `${rowData[2]}%`
            }
            return 'N/A'
          },
        },
      },
      {
        label: 'Provider',
        name: 'provider',
        options: {
          filter: true,
          sort: false,
          filterType: 'multiselect',
          filterOptions: {
            names: providerNames,
          },
        },
      },
      {
        label: 'Category',
        name: 'category',
        options: {
          filter: true,
          sort: false,
          filterType: 'multiselect',
          filterOptions: {
            names: categoryNames,
          },
        },
      },
      {
        label: 'Status',
        name: 'approvalStatus',
        options: {
          filter: true,
          sort: false,
          filterType: 'multiselect',
          filterOptions: {
            names: ['approved', 'declined', 'pending'],
          },
        },
      },
      {
        label: 'Released Date',
        name: 'releasedAt',
        options: {
          sort: false,
          customBodyRenderLite: dataIndex => {
            return new Date(data[dataIndex].releasedAt).toLocaleString(
              'en-US',
              { year: 'numeric', month: 'long', day: 'numeric' },
            )
          },
        },
      },
      {
        name: 'actions',
        label: 'Actions',
        options: {
          sort: false,
          filter: false,
          customBodyRender: (_, { rowData }) => {
            const identifier = rowData[0]
            if (!identifier) {
              return null
            }

            return (
              <EditTPGameButton
                className={classes.ListGamesActions_addMargin}
                color="primary"
                variant="contained"
                onClick={() => {
                  setGameIdentifier(identifier)
                  setEditDialogOpen(true)
                }}
              >
                Edit
              </EditTPGameButton>
            )
          },
        },
      },
      {
        label: 'Tag',
        name: 'tag',
        options: {
          filter: true,
          sort: false,
          display: false,
          filterType: 'multiselect',
          filterOptions: {
            names: tagNames.map(tag => tag.title),
          },
        },
      },
      {
        label: 'Aggregator',
        name: 'aggregator',
        options: {
          display: false,
          filter: true,
          sort: false,
          filterType: 'multiselect',
          filterOptions: {
            names: aggregatorNames,
          },
        },
      },
    ],
    [data, categoryNames, providerNames, aggregatorNames, tagNames],
  )

  const onFetch = async (params = {}, tableState: TableState = {}) => {
    const page = tableState?.page ?? currentPageRef.current ?? 0
    let newFilterObj = { ...currentFilterObj }
    if (tableState.searchText || tableState.filterList) {
      newFilterObj = {
        title: tableState?.searchText ?? '',
        providers: tableState?.filterList?.[3] ?? '',
        categories: tableState?.filterList?.[4] ?? '',
        approvalStatuses: tableState?.filterList?.[5] ?? '',
        aggregators: tableState?.filterList?.[9] ?? '',
        tags:
          (Array.isArray(tableState?.filterList?.[8])
            ? (tableState?.filterList?.[8] as string[]).map(
                tagName =>
                  tagNames.find((tag: GameTag) => tag.title === tagName)?.id,
              )
            : []) || [],
      }
      setCurrentFilterObj(newFilterObj)
    }

    const { data: refetchedData, loading: refetchedGameDataLoading } =
      await refetchData({
        limit: options.rowsPerPage,
        page,
        filterObj: newFilterObj,
      })

    if (!refetchedGameDataLoading && refetchedData) {
      const { tpGamesAdminPaginated: gameData } = refetchedData

      if (gameData && gameData.data) {
        setData(gameData.data)
        setOptions(prevOptions => ({
          ...prevOptions,
          count: gameData.count,
        }))
      }
    }
  }

  const handleTableChange = (action, tableState) => {
    if (action === 'filterChange') {
      setOptions(prev => ({
        ...prev,
        page: 0,
      }))
      currentPageRef.current = 0
      onFetch({}, { ...tableState, page: 0 })
    } else if (action === 'changePage') {
      currentPageRef.current = tableState.page
      setOptions(prev => ({
        ...prev,
        page: tableState.page,
      }))
      onFetch({}, tableState)
    } else if (action === 'search') {
      onFetch({}, tableState)
    }
  }

  return (
    <>
      {isFirstLoad ? (
        <Loading />
      ) : (
        <ReadTPGameDatatable
          data={data}
          columns={columns}
          options={{
            ...options,
            onTableChange: handleTableChange,
            customToolbarSelect: (selectedRows, displayData) => {
              if (!displayData.length || !selectedRows.data.length) {
                return null
              }

              const selectedIdentifiersList = selectedRows.data.map(
                row => displayData[row.index].data[0],
              )
              return (
                <div>
                  <EditTPGameButton
                    className={classes.ListGamesActions_addMargin}
                    color="primary"
                    variant="contained"
                    onClick={() =>
                      updateApprovalStatus(selectedIdentifiersList)
                    }
                  >
                    Set Approval Status
                  </EditTPGameButton>
                  <EditTPGameButton
                    className={classes.ListGamesActions_addMargin}
                    color="primary"
                    variant="contained"
                    onClick={() => {
                      setGamesToUpdate(selectedIdentifiersList)
                      setCategoryDialogOpen(true)
                    }}
                  >
                    Set Category
                  </EditTPGameButton>
                </div>
              )
            },
          }}
          serverSide={{ onFetch }}
        />
      )}
      {editDialogOpen && (
        <TPGameUpdateDialog
          open={editDialogOpen}
          setOpen={setEditDialogOpen}
          gameIdentifier={gameIdentifier}
          onUpdateCompleted={handleUpdateCompleted}
        />
      )}
      {categoryDialogOpen && (
        <TPGameCategoryDialog
          open={categoryDialogOpen}
          setOpen={setCategoryDialogOpen}
          existingCategories={categoryNames}
          gamesToUpdate={gamesToUpdate}
          onUpdateCompleted={handleUpdateCompleted}
        />
      )}
    </>
  )
}
