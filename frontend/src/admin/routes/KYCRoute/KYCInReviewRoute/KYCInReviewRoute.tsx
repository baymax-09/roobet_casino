import React from 'react'
import { Button } from '@mui/material'
import { Link } from 'react-router-dom'

import { useAxiosGet } from 'common/hooks'
import { DataTable, Loading, TitleContainer } from 'mrooi'
import { type KYCGet, type UserDocument, type KYCLevel } from 'common/types'
import { formatDate } from 'admin/components/KYCOverview'

interface KYCPendingReviewResult {
  user: { id: string; name: string; kycLevel?: KYCLevel }
  kyc: KYCGet | null
  document: UserDocument
}

const columns = (data: KYCPendingReviewResult[]) => [
  {
    name: 'updatedAt',
    label: 'Submitted At',
    type: 'date',
    options: {
      sort: true,
      customBodyRender: (_, { rowIndex }) => {
        const row = data[rowIndex]

        if (!row?.document?.createdAt) {
          return 'N/a'
        }

        const createdAt = new Date(row.document.createdAt)

        return formatDate(createdAt)
      },
    },
  },
  {
    name: 'username',
    label: 'Username',
    type: 'string',
    options: {
      sort: false,
      customBodyRender: (_, { rowIndex }) => {
        const row = data[rowIndex]

        if (!row) {
          return ''
        }

        return row.user.name ?? 'N/a'
      },
    },
  },
  {
    name: 'currentLevel',
    label: 'Current Level',
    type: 'string',
    options: {
      sort: false,
      customBodyRender: (_, { rowIndex }) => {
        const row = data[rowIndex]

        return row?.user?.kycLevel ?? 'N/a'
      },
    },
  },
  {
    name: 'pendingLevels',
    label: 'Pending Levels',
    type: 'string',
    options: {
      sort: false,
      customBodyRender: (_, { rowIndex }) => {
        const row = data[rowIndex]

        if (!row?.kyc) {
          return 'N/a'
        }

        const pending: number[] = []

        for (const [level, { status }] of Object.entries(
          row.kyc.levels ?? {},
        )) {
          if (status === 'pending') {
            pending.push(Number(level))
          }
        }

        return pending.length ? pending.join(', ') : 'N/a'
      },
    },
  },
  {
    name: 'actions',
    label: 'Actions',
    options: {
      sort: false,
      customBodyRender: (_, { rowIndex }) => {
        const row = data[rowIndex]

        if (!row) {
          return ''
        }

        return (
          <Link
            component={Button}
            target="_blank"
            to={`/users?userDropdown=kyc&index=id&key=${row.user.id}`}
          >
            Review
          </Link>
        )
      },
    },
  },
]

const PAGE_SIZE = 10

interface KYCInReviewTableState {
  internalPage: number
  page: number
  sort: {
    column: string
    direction: 'desc' | 'asc'
  }
}

export const KYCInReviewRoute = React.memo(() => {
  const [tableData, setTableData] = React.useState<KYCInReviewTableState>({
    internalPage: 0,
    page: 0,
    sort: {
      column: 'updatedAt',
      direction: 'desc',
    },
  })

  const params = new URLSearchParams()

  // Set search query params.
  params.set(
    `sort[${tableData.sort.column}]`,
    tableData.sort.direction === 'desc' ? '-1' : '1',
  )
  params.set('skip', `${tableData.internalPage * PAGE_SIZE}`)
  params.set('limit', `${PAGE_SIZE}`)

  const [{ data }, reload] = useAxiosGet<{
    total: number
    sample: KYCPendingReviewResult[]
  }>(`admin/kyc/pending?${params}`, {
    onCompleted: () => {
      setTableData(prev => ({
        ...prev,
        page: prev.internalPage,
      }))
    },
  })

  // Here we are faking the rows length. This is beyond stupid but the DataTable
  // component does not support server-side pagination.
  const prefixRecordCount = tableData.page * PAGE_SIZE
  const suffixRecordCount = Math.max(
    (data?.total ?? 0) - (prefixRecordCount + (data?.sample.length ?? 0)),
    0,
  )

  const rows = [
    ...Array(prefixRecordCount),
    ...(data?.sample ?? []),
    ...Array(suffixRecordCount),
  ]

  return !data ? (
    <Loading />
  ) : (
    <TitleContainer
      title="KYC In Review"
      actions={() => [
        {
          value: 'Reload',
          onClick: () => {
            setTableData(prev => {
              if (prev.internalPage === 0) {
                reload()
                return prev
              }

              return {
                ...prev,
                internalPage: 0,
              }
            })
          },
        },
      ]}
    >
      <DataTable
        hideToolbar
        columns={columns(rows)}
        data={rows}
        options={{
          rowsPerPage: PAGE_SIZE,
          page: tableData.page,
          sortOrder: {
            name: tableData.sort.column,
            direction: tableData.sort.direction,
          },
          onChangePage: (internalPage: number) => {
            setTableData(prev => ({
              ...prev,
              internalPage,
            }))
          },
          onColumnSortChange: (column: string, direction: 'desc' | 'asc') => {
            setTableData(prev => ({
              ...prev,
              sort: { column, direction },
            }))
          },
        }}
      />
    </TitleContainer>
  )
})
