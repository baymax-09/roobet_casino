import React from 'react'
import { Link } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import numeral from 'numeral'
import { type MUIDataTableColumn } from 'mui-datatables'

import { DataTable } from 'mrooi'
import { api } from 'common/util'

import { useRoowardsReloadRouteStyles } from './RoowardsReloadRoute.styles'

interface ReloadData {
  _id: string
  userId: string
  user: { name: string }
  amount: number
  currency: string
  interval: number
  lastClaimed: string
}

export const RoowardsReloadRoute: React.FC = React.memo(() => {
  const classes = useRoowardsReloadRouteStyles()
  const [data, setData] = React.useState<ReloadData[]>([])

  const options = React.useMemo(
    () => ({
      searchOpen: false,
    }),
    [],
  )

  const columns: MUIDataTableColumn[] = React.useMemo(
    () => [
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
        name: 'userName',
        options: {
          filter: false,
          sort: false,
          filterType: 'textField',
          customBodyRenderLite: dataIndex => {
            const user = data[dataIndex].user
            const userId = data[dataIndex].userId

            return (
              <Link
                component={RouterLink}
                className={classes.userLink}
                to={`/users?expanded=roowards&userId=${userId}`}
                target="_blank"
                underline="hover"
              >
                {!!user && !!user.name ? user.name : userId}
              </Link>
            )
          },
        },
      },
      {
        name: 'currency',
        label: 'Currency',
        options: {
          filter: false,
          display: false,
          customBodyRenderLite: dataIndex => {
            return data[dataIndex].currency
          },
        },
      },
      {
        name: 'amount',
        label: 'Amount',
        options: {
          filter: false,
          customBodyRenderLite: dataIndex => {
            return numeral(data[dataIndex].amount).format(
              data[dataIndex].amount >= 1 ? '$0,0.00' : '$0,0.00[0000]',
            )
          },
        },
      },
      {
        name: 'interval',
        label: 'Claim Interval',
        options: {
          filter: false,
          customBodyRenderLite: dataIndex => {
            const { interval } = data[dataIndex]
            let str = ''

            if (interval < 3600) {
              str = `${interval / 60} minute(s)`
            } else if (interval < 86400) {
              str = `${interval / 3600} hour(s)`
            } else {
              str = `${interval / 86400} day(s)`
            }

            return `Every ${str}`
          },
        },
      },
      {
        name: 'lastClaimedAt',
        label: 'Last Claimed',
        options: {
          filter: false,
          customBodyRenderLite: dataIndex => {
            return data[dataIndex].lastClaimed
          },
        },
      },
    ],
    [data],
  )

  const onFetch = (params, tableState) => {
    setData([])

    const userId = tableState.searchText

    const filter: Partial<ReloadData> = {}
    const sort = {}

    if (tableState) {
      const { filterList, sortOrder } = tableState

      if (filterList) {
        const id = filterList[0] || []

        if (!!id && id.length > 0) {
          filter._id = id[0]
          delete filter.userId
        }

        if (!!userId && userId.length > 0) {
          filter.userId = userId
        }
      }

      if (!!sortOrder && sortOrder.name) {
        sort[sortOrder.name] = sortOrder.direction === 'desc' ? -1 : 1
      }
    }

    return api
      .post<unknown, { reloads: ReloadData[] }>('admin/roowards/reloads', {
        ...params,
        filter,
        sort,
      })
      .then(result => {
        setData(result.reloads)
        return result
      })
  }

  return (
    <DataTable
      title="Rooward Reloads"
      data={data}
      columns={columns}
      options={options}
      serverSide={{
        onFetch,
      }}
    />
  )
})
