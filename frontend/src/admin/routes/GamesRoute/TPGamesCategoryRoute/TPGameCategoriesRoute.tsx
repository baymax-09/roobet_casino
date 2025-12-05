import React from 'react'
import { Button } from '@mui/material'
import {
  type MUIDataTableOptions,
  type MUIDataTableColumn,
} from 'mui-datatables'
import { useQuery } from '@apollo/client'

import { api } from 'common/util'
import { DataTable } from 'mrooi'
import { withRulesAccessController } from 'admin/components'
import { type GameTag, type TPGame } from 'common/types'
import { useToasts } from 'common/hooks'
import { GameTagsNotCachedQuery, TPGameMetadataQuery } from 'admin/gql'

import { TPGameCategoriesDialog } from './TPGameCategoriesDialog'

import { useListGameCategoriesRouteStyles } from './TPGameCategories.styles'

interface TableState {
  searchText?: string
  filterList?: string[]
  page?: number
}

const EditTPCategoryButton = withRulesAccessController(
  ['tpgames:update'],
  Button,
)
const ReadTPCategoryDatatable = withRulesAccessController(
  ['tpgames:read'],
  DataTable,
)
const UpdateTPCategoryDialog = withRulesAccessController(
  ['tpgames:update'],
  TPGameCategoriesDialog,
)

const TPGameCategoriesRoute = () => {
  const [data, setData] = React.useState<TPGame[]>([])
  const classes = useListGameCategoriesRouteStyles()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [category, setCategory] = React.useState({ name: '', games: [] })
  const { toast } = useToasts()

  const options: MUIDataTableOptions = {
    rowsPerPage: 25,
    search: true,
    filter: true,
    serverSide: true,
  }

  const { data: tagResponse } = useQuery(GameTagsNotCachedQuery, {
    onError: error => {
      toast.error(error.message)
    },
  })

  const { gameTagsNotCached } = tagResponse || {}
  const tags = gameTagsNotCached || []
  const tagNames = Object.values(tags as GameTag[])

  const { data: TPGameMetadata } = useQuery(TPGameMetadataQuery, {
    onError: error => {
      toast.error(error.message)
    },
  })

  const { tpGameMetadata } = TPGameMetadata || {}
  const { categories, aggregators, providers } = tpGameMetadata || {}
  const categoryNames = categories || []
  const aggregatorNames = aggregators || []
  const providerNames = providers || []

  const columns = React.useMemo(
    (): MUIDataTableColumn[] => [
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
        label: 'Game Count',
        name: 'games',
        options: {
          sort: false,
          filter: false,
          customBodyRender: (_, { rowData }) => {
            return rowData[1].length
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
            return (
              <EditTPCategoryButton
                className={classes.ListCategoriesActions__addMargin}
                color="primary"
                variant="contained"
                onClick={() => {
                  setCategory({ name: rowData[0], games: rowData[1] })
                  setDialogOpen(true)
                }}
              >
                Edit
              </EditTPCategoryButton>
            )
          },
        },
      },
      {
        label: 'Approval Status',
        name: 'approvalStatus',
        options: {
          display: false,
          filter: true,
          sort: false,
          filterType: 'multiselect',
          filterOptions: {
            names: ['approved', 'declined', 'pending'],
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
        label: 'Provider',
        name: 'provider',
        options: {
          display: false,
          filter: true,
          sort: false,
          filterType: 'multiselect',
          filterOptions: {
            names: providerNames,
          },
        },
      },
    ],
    [data, categories, providers, aggregators, tagNames],
  )

  const handleUpdateCompleted = () => {
    onFetch()
      .then(() => {
        toast.success('Category Table Updated')
      })
      .catch(error => {
        toast.error('Error Updating Category Table:', error)
      })
  }

  const onFetch = (params = {}, tableState: TableState = {}) => {
    const endpoint = 'admin/table/tp-games/category'
    const filterObj = {
      searchedCategory: tableState?.searchText ?? '',
      category: tableState?.filterList?.[0] ?? '',
      approvalStatus: tableState?.filterList?.[3] ?? '',
      aggregator: tableState?.filterList?.[4] ?? '',
      provider: tableState?.filterList?.[6] ?? '',
      // filter tag name and send tag id to filter
      tag:
        (Array.isArray(tableState?.filterList?.[5])
          ? (tableState?.filterList?.[5] as string[]).map(
              tagName =>
                tagNames.find((tag: GameTag) => tag.title === tagName)?.id,
            )
          : []) || [],
    }

    return api
      .post(endpoint, {
        ...params,
        filterObj,
      })
      .then(result => {
        setData(result.data)
      })
      .catch(error => {
        toast.error(error)
      })
  }

  return (
    <>
      <ReadTPCategoryDatatable
        title=""
        data={data}
        columns={columns}
        options={options}
        serverSide={{ onFetch }}
      />
      {dialogOpen && (
        <UpdateTPCategoryDialog
          open={dialogOpen}
          setOpen={setDialogOpen}
          category={category}
          onUpdateCompleted={handleUpdateCompleted}
        />
      )}
    </>
  )
}

export default React.memo(TPGameCategoriesRoute)
