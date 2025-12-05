import React, { useState } from 'react'
import { Button, Tab, Tabs } from '@mui/material'
import { useMutation, useQuery } from '@apollo/client'
import moment from 'moment'

import { TitleContainer, DataTable, Loading } from 'mrooi'
import { useToasts, useConfirm } from 'common/hooks'
import {
  ApproveFlaggedWithdrawalMutation,
  FlaggedWithdrawalCreatedSubscription,
  FlaggedWithdrawalsQuery,
  RejectFlaggedWithdrawalMutation,
  type FlaggedWithdrawalMutationData,
} from 'admin/gql/withdrawals'

const baseColumns = [
  {
    name: 'id',
    label: 'ID',
    type: 'string',
    options: {
      display: false,
      filter: false,
      sort: false,
    },
  },
  {
    name: 'createdAt',
    label: 'Withdrawn At',
    type: 'string',
    options: {
      customBodyRender: value => moment(value).format('YYYY-MM-DD HH:MM:SS'),
      filter: false,
    },
  },
  {
    name: 'user.name',
    label: 'Username',
    type: 'string',
    options: {
      filter: false,
    },
  },
  {
    name: 'user.role',
    label: 'Role',
    type: 'string',
  },
  {
    name: 'user.createdAt',
    label: 'Registration Date',
    type: 'string',
    options: {
      customBodyRender: value => moment(value).format('YYYY-MM-DD'),
      filter: false,
    },
  },
  {
    name: 'user.lifetimeValue',
    label: 'LTV',
    type: 'string',
    options: {
      customBodyRender: value =>
        value?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      filter: false,
    },
  },
  {
    name: 'reason',
    label: 'Reason',
    type: 'string',
  },
  {
    name: 'totalValue',
    label: 'Amount',
    type: 'string',
    options: {
      customBodyRender: value =>
        value?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      filter: false,
    },
  },
  {
    name: 'user.numFlaggedWithdrawals',
    label: 'PFWs',
    type: 'string',
    options: {
      filter: false,
    },
  },
]

const tabs = {
  flaggedWithdrawals: {
    label: 'Flagged Withdrawals',
    fetch: () => ({
      query: FlaggedWithdrawalsQuery,
      variables: {
        input: {},
      },
      fetchPolicy: 'no-cache',
    }),
    subscribe: () => ({
      subscription: FlaggedWithdrawalCreatedSubscription,
    }),
    columns: ({ confirmWithdrawalDecision }) => [
      ...baseColumns,
      {
        name: 'actions',
        label: 'Actions',
        options: {
          sort: false,
          filter: false,
          customBodyRender: (_, { rowData }) => {
            const id = rowData[0]

            return (
              <div>
                <Button
                  color="primary"
                  size="small"
                  onClick={() =>
                    confirmWithdrawalDecision({ id, shouldReject: false })
                  }
                >
                  Approve
                </Button>
                <Button
                  color="primary"
                  size="small"
                  onClick={() =>
                    confirmWithdrawalDecision({ id, shouldReject: true })
                  }
                >
                  Reject
                </Button>
              </div>
            )
          },
        },
      },
    ],
  },
} as const

type TableTabs = keyof typeof tabs
interface TableProps {
  tab?: TableTabs
}

const FlaggedWithdrawalsTable: React.FC<TableProps> = ({
  tab = 'flaggedWithdrawals',
}) => {
  const confirm = useConfirm()
  const { toast } = useToasts()
  const [tableViewTab, setTableViewTab] = useState<TableTabs>(tab)
  const [tableData, setTableData] = React.useState([])

  const onError = ({ message }) => {
    toast.error(message)
  }

  const { query, variables } = tabs[tableViewTab].fetch()
  const { subscription } = tabs[tableViewTab].subscribe()

  const { data, loading, subscribeToMore } = useQuery(query, {
    variables,
  })

  if (subscription) {
    subscribeToMore({
      document: subscription,
      updateQuery: (prev, { subscriptionData }) => {
        if (subscriptionData.data) {
          const newData = subscriptionData?.data?.flaggedWithdrawalCreated
          if (newData) {
            const existingIndex = prev.flaggedWithdrawalsQuery.findIndex(
              withdrawal => withdrawal.id === newData.id,
            )

            if (existingIndex !== -1) {
              // Update the record if it's already in the previous result set somehow.
              const withdrawals = prev.flaggedWithdrawalsQuery
              return [
                ...withdrawals.slice(0, existingIndex),
                newData,
                ...withdrawals.slice(existingIndex + 1),
              ]
            } else {
              // Otherwise, which should be the default case, append to the data array.
              return {
                flaggedWithdrawalsQuery: [
                  ...prev.flaggedWithdrawalsQuery,
                  newData,
                ],
              }
            }
          }
        }
        return prev
      },
    })
  }

  const [approveFlaggedWithdrawal] = useMutation<FlaggedWithdrawalMutationData>(
    ApproveFlaggedWithdrawalMutation,
    {
      onError,
      onCompleted: () => {
        toast.success('Withdrawal approved.')
      },
      refetchQueries: [
        { query: FlaggedWithdrawalsQuery, variables: { input: {} } },
      ],
    },
  )

  const [rejectFlaggedWithdrawal] = useMutation<FlaggedWithdrawalMutationData>(
    RejectFlaggedWithdrawalMutation,
    {
      onError,
      onCompleted: () => {
        toast.success('Withdrawal rejected.')
      },
      refetchQueries: [
        { query: FlaggedWithdrawalsQuery, variables: { input: {} } },
      ],
    },
  )

  const confirmWithdrawalDecision = async ({
    id,
    shouldReject,
  }: {
    id: string
    shouldReject: boolean
  }) => {
    try {
      const { note }: { note?: string } = await confirm({
        title: `${shouldReject ? 'Reject' : 'Approve'} Withdrawal`,
        message:
          'Enter a note to explain the reason behind this decision (optional).',
        inputs: [
          {
            type: 'text',
            key: 'note',
            name: 'Note',
            required: false,
          },
        ],
      })

      const variables = { variables: { data: { id, note } } }
      if (shouldReject) {
        await rejectFlaggedWithdrawal(variables)
      } else {
        await approveFlaggedWithdrawal(variables)
      }
    } catch (error) {
      if (error) {
        toast.error('There was an error updating this withdrawal.')
      }
    }
  }

  React.useEffect(() => {
    const dataSource = data?.flaggedWithdrawalsQuery
    if (dataSource) {
      setTableData(dataSource)
    }
  }, [data])

  const datatableOptions = {
    print: false,
    filter: true,
    search: true,
  }

  const searchOptions = {
    label: 'Username',
    columns: ['user.name'],
  }

  const loadingTable = loading
  const columns = loadingTable
    ? []
    : tabs[tableViewTab].columns({
        confirmWithdrawalDecision,
      })

  const parsedTableData = tableData.map((tableRow: { user?: object }) => {
    if (tableRow.user) {
      const flattenedRow = { ...tableRow }
      // Unwind the embedded user object and flatten it so the data table can access user props.
      for (const userKey of Object.keys(tableRow.user)) {
        flattenedRow[`user.${userKey}`] = tableRow.user[userKey]
      }

      const { user, ...row } = flattenedRow
      return row
    }
    return tableRow
  })

  return (
    <TitleContainer title="Flagged Withdrawals" actions={() => []}>
      <Tabs
        indicatorColor="primary"
        value={tableViewTab}
        onChange={(_, newTabKey) => {
          setTableViewTab(newTabKey)
        }}
      >
        {Object.entries(tabs).map(([key, tab]) => (
          <Tab
            key={key}
            value={key}
            label={tab.label}
            onClick={() => setTableViewTab(key as TableTabs)}
          />
        ))}
      </Tabs>
      {loadingTable ? (
        <Loading />
      ) : (
        <DataTable
          columns={columns}
          data={parsedTableData}
          options={datatableOptions}
          search={searchOptions}
        />
      )}
    </TitleContainer>
  )
}

export const FlaggedWithdrawalsList: React.FC = () => (
  <FlaggedWithdrawalsTable tab="flaggedWithdrawals" />
)
