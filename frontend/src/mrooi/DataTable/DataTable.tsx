import React, { useRef, useState } from 'react'
import {
  Typography,
  CircularProgress,
  TextField,
  IconButton,
  TableFooter,
  TableRow,
  TablePagination,
  Button,
} from '@mui/material'
import MUIDataTable, {
  type MUIDataTableState,
  type MUIDataTableOptions,
  type MUIDataTableColumn,
  type MUISortOptions,
} from 'mui-datatables'
import RefreshIcon from '@mui/icons-material/Refresh'
import GetAppIcon from '@mui/icons-material/GetApp'
import clsx from 'clsx'
import { type MomentInput } from 'moment'

import { api } from 'common/util'
import { buildTimestampFilter } from 'common/util/date'

import TablePaginationActions from './Private/TablePaginationActions'

import { useDataTableStyles } from './DataTable.styles'

const transformTableFilterState = (
  tableState: MUIDataTableState,
  filters: ServerSideFilter[],
  search,
  userId,
) => {
  const { filterList } = tableState

  const filterObj: {
    userId?: string
    createdAt?: object
    $or?: object[]
  } = {
    userId,
  }

  if (!filterList) {
    return filterObj
  }

  // Map table state filter values to document properties.
  for (const assignment of filters) {
    const value = filterList[assignment.index] || []

    // Determine if the filter has a value.
    if (!!value && value.length > 0) {
      if (assignment.dateRange) {
        // TODO: types on tableState.filterList are wrong
        const { start, end } = value[0] as unknown as {
          start: MomentInput
          end: MomentInput
        }
        filterObj[assignment.key] = buildTimestampFilter(start, end)
      } else if (assignment.dateTimeRange) {
        // TODO: types on tableState.filterList are wrong
        const { start, end } = value[0] as unknown as {
          start: MomentInput
          end: MomentInput
        }
        filterObj[assignment.key] = buildTimestampFilter(start, end, true)
      } else if (assignment.regex) {
        filterObj[assignment.key] = `/${value[0]}/`
      } else if (assignment.exists) {
        if (value[0] === 'Yes') {
          filterObj[assignment.key] = { $exists: true, $ne: false }
        } else if (value[0] === 'No') {
          filterObj.$or = [
            { [assignment.key]: { $exists: false } },
            { [assignment.key]: { $eq: false } },
          ]
        }
      } else {
        filterObj[assignment.key] = value[0]
      }

      // If the filter is an id, then we prefer it over than the user id.
      if (assignment.isId) {
        delete filterObj.userId
      }
    }
  }

  // Map search values.
  if (search && tableState.searchText) {
    for (const col of search.columns) {
      filterObj[col] = ['_id', 'id'].includes(col)
        ? tableState.searchText
        : `/${tableState.searchText}/`
    }
  }

  return filterObj
}

const transformTableSortState = (tableState: MUIDataTableState) => {
  if (!tableState) {
    return
  }

  const { sortOrder } = tableState

  if (!sortOrder?.name) {
    return undefined
  }

  return {
    [sortOrder.name]: sortOrder.direction !== 'asc' ? -1 : 1,
  }
}

export interface ServerSideFilter {
  key: string
  regex?: boolean
  index: number
  exists?: boolean
  dateRange?: boolean
  dateTimeRange?: boolean
  isId?: boolean
}

interface DataTableProps {
  columns: MUIDataTableColumn[]
  data: any[]
  title?: string
  rowsEachPage?: number
  // Filter List does not exists in version 4
  options?: MUIDataTableOptions & { filterList?: string[][] }
  hideToolbar?: boolean
  className?: string
  exportUrl?: string
  search?: {
    label: string
    columns: string[]
  }
  serverSide?: {
    userId?: string
    setData?: (data: any[]) => void
    fetchUrl?: string
    // Will override the native fetch functionality and above values.
    onFetch?: (params: any, tableState: any) => void
    filters?: ServerSideFilter[]
    defaultFilters?: ServerSideFilter[]
  }
}

export const DataTable: React.FC<DataTableProps> = ({
  data = [],
  options = {},
  exportUrl = '',
  serverSide,
  search,
  rowsEachPage = 25,
  columns = [],
  title,
  hideToolbar,
  className,
}) => {
  const classes = useDataTableStyles()
  // I hate to do this but honestly this packages is way out of date
  const tableRef = useRef<any>(null)
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [count, setCount] = useState(0)
  const [rowsPerPage] = useState(rowsEachPage)
  const [sortOrder, setSortOrder] = useState<MUISortOptions | undefined>(
    options.sortOrder,
  )

  const canFetch = !!serverSide

  // Amend column filter render options.
  const repairedColumns = [...columns].map(col => {
    if (options.filter && col.options?.filter) {
      col.options.customFilterListOptions = {
        // Default render fn.
        render: val => `${col.label}: ${val}`,
        ...(col.options.customFilterListOptions ?? {}),
      }
    }

    return col
  })

  // See https://github.com/gregnb/mui-datatables/issues/807
  const [tableState, setTableState] = React.useState<{
    filterList: MUIDataTableState['filterList']
    columns: MUIDataTableColumn[]
  }>({
    filterList: options?.filterList || [],
    columns: repairedColumns,
  })

  const parsedColumns = React.useMemo(() => {
    return repairedColumns.map((column, i) => {
      // Assign the filter list to persist
      const newColumn = {
        ...column,
        options: { ...column.options, filterList: tableState.filterList[i] },
      }

      if (tableState.columns[i] !== undefined) {
        // If 'display' has a value in tableState, assign that, or else leave it alone
        if (
          Object.prototype.hasOwnProperty.call(tableState.columns[i], 'display')
        ) {
          newColumn.options.display = tableState.columns[i].options?.display
        }
        // If 'sortDirection' has a value in tableState, assign that, or else leave it alone
        if (
          Object.prototype.hasOwnProperty.call(
            tableState.columns[i],
            'sortDirection',
          )
        ) {
          // The sortDirection prop only permits sortDirection for one column at a time
          if (tableState.columns[i].options?.sortDirection !== 'none') {
            newColumn.options.sortDirection =
              tableState.columns[i].options?.sortDirection
          }
        }
      }
      return newColumn
    })
  }, [repairedColumns, tableState.columns, tableState.filterList])

  const tableOptions: MUIDataTableOptions = {
    count,
    page,
    rowsPerPage,
    searchOpen: false,
    selectableRows: 'none',
    filter: !!serverSide?.filters,
    filterType: 'dropdown',
    elevation: 0,
    serverSide: !!serverSide,
    download: false,
    print: false,
    search: !!search,
    confirmFilters: true,
    sortOrder,
    responsive: 'simple',

    customToolbar: () => {
      return (
        <>
          {canFetch && (
            <IconButton
              onClick={() => {
                fetchData(
                  { page: tableRef.current?.state.page },
                  tableRef.current?.state,
                )
              }}
              disabled={loading}
              size="large"
            >
              <RefreshIcon />
            </IconButton>
          )}

          {exportUrl && (
            <a href={exportUrl} target="_blank" rel="noopener noreferrer">
              <IconButton size="large">
                <GetAppIcon />
              </IconButton>
            </a>
          )}
        </>
      )
    },

    // TODO: Implement fuzzy search/something more sophisticated.
    customSearch: (query, row) => {
      if (!search) {
        return true
      }

      for (const property of search.columns) {
        const index = repairedColumns.findIndex(col => col.name === property)

        // Check if row value includes query.
        if (String(row[index]).includes(query)) {
          return true
        }
      }

      return false
    },

    customSearchRender: (searchText, handleSearch) => {
      return (
        <TextField
          variant="standard"
          value={searchText}
          onChange={({ target }) => handleSearch(target.value)}
          style={{ margin: 8 }}
          label={search?.label}
          fullWidth
          margin="normal"
        />
      )
    },

    customFooter: (count, page, rowsPerPage, _, changePage) => {
      const handleChangePage = (_, page) => {
        changePage(page)
        setPage(page)
      }

      return (
        <TableFooter>
          <TableRow>
            <TablePagination
              count={count}
              style={{ maxWidth: 100 }}
              rowsPerPageOptions={[]}
              rowsPerPage={rowsPerPage}
              page={page}
              slotProps={{
                select: {
                  inputProps: { 'aria-label': 'rows per page' },
                  native: true,
                },
              }}
              onPageChange={handleChangePage}
              ActionsComponent={TablePaginationActions}
            />
          </TableRow>
        </TableFooter>
      )
    },

    onTableChange: (action, tableState) => {
      const updateActions = [
        'search',
        'filterChange',
        'resetFilters',
        'changePage',
        'sort',
      ]

      // See https://github.com/gregnb/mui-datatables/issues/807
      if (action !== 'propsUpdate') {
        setTableState(prevState => ({
          ...prevState,
          filterList: tableState.filterList, // An array of filters for all columns
          columns: tableState.columns,
        }))
      }

      if (canFetch && updateActions.includes(action)) {
        // Clear existing timeout.
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current)
        }

        fetchTimeoutRef.current = setTimeout(() => {
          fetchData({ page: tableState.page }, tableState)
        }, 300)
      }
    },

    customFilterDialogFooter: (_, applyNewFilters) => {
      return (
        <Button
          className={classes.applyFilters}
          variant="contained"
          color="primary"
          onClick={applyNewFilters}
        >
          {/* eslint-disable i18next/no-literal-string */}
          Apply Filters
        </Button>
      )
    },

    onColumnSortChange: (
      name: string,
      direction: MUISortOptions['direction'],
    ) => {
      setSortOrder({ name, direction })
    },

    ...options,
  }

  const nativeOnFetch = (
    params,
    tableState: MUIDataTableState,
  ): Record<string, any> => {
    if (!serverSide || !serverSide.fetchUrl) {
      return {}
    }

    const sortObj = transformTableSortState(tableState)
    const filterObj = {
      ...transformTableFilterState(
        tableState,
        serverSide.filters ?? [],
        search,
        serverSide.userId,
      ),
      ...(serverSide.defaultFilters ?? {}),
    }

    return api.post(serverSide.fetchUrl, {
      ...params,
      filterObj,
      sortObj,
    })
  }

  const fetchData = async (params, tableState) => {
    if (!serverSide) {
      return
    }

    setLoading(true)

    // allow for an onFetch prop to override the native onFetch
    const fetchOperation = serverSide.onFetch ?? nativeOnFetch

    try {
      const result = await fetchOperation(
        { userId: serverSide.userId, ...params },
        tableState,
      )

      if (result) {
        // Push data to parent if setData is present.
        if (serverSide.setData) {
          serverSide.setData(result.data)
        }

        setCount(result.count)
        setPage(result.page)
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount.
  React.useEffect(() => {
    fetchData({ page: 0 }, {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSide?.fetchUrl, serverSide?.userId])

  return (
    <div className={classes.root}>
      <MUIDataTable
        innerRef={tableRef}
        // @ts-expect-error incorrect types
        className={clsx(classes.table, className)}
        options={tableOptions}
        columns={parsedColumns}
        data={data}
        components={{
          ...(hideToolbar ? { TableToolbar: () => null } : {}),
        }}
        title={
          <Typography variant="h6">
            {!loading ? (
              title
            ) : (
              <>
                {'Loading... '}
                <CircularProgress
                  color="primary"
                  size={24}
                  style={{ marginLeft: 15, position: 'relative', top: 4 }}
                />
              </>
            )}
          </Typography>
        }
      />
    </div>
  )
}
