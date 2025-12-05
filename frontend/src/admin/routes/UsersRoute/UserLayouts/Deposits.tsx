import React from 'react'
import { TableRow, TableCell, Paper } from '@mui/material'
import ReactJson from 'react-json-view'
import numeral from 'numeral'
import { type MUIDataTableColumn } from 'mui-datatables'
import { type Writable } from 'ts-essentials'

import { DataTable, DateRangePickerFilter } from 'mrooi'
import { createMoment } from 'common/util/date'
import { ViewOnBlockchair } from 'admin/components'
import { env } from 'common/constants'
import { api } from 'common/util'
import { useDarkMode } from 'admin/context'
import { useToasts } from 'common/hooks'
import { useAccessControl } from 'admin/hooks'

import { type UserData } from '../types'

import { useDepositsStyles } from './Deposits.styles'

const providerList = [
  'AstroPayCard',
  'Interac',
  'MuchBetter',
  'Payop',
  'BestPay',
  'SafeCharge',
  'Directa24',
  'Payper',
  'totalProcessing',
  'bitcoin',
  'ethereum',
  'litecoin',
  'dogecoin',
] as const

interface DepositsProps {
  userData: UserData
}

interface DepositData {
  depositType: string
  createdAt: string
  provider: string
  amount: number
  meta: {
    txHash?: string
  }
}

export const Deposits: React.FC<DepositsProps> = ({ userData }) => {
  const classes = useDepositsStyles()
  const [isDarkMode] = useDarkMode()
  const { toast } = useToasts()

  const { hasAccess: canUpdateDeposits } = useAccessControl(['deposits:update'])

  const [data, setData] = React.useState<DepositData[]>([])

  const cryptoDeposits = [
    'bitcoin',
    'ethereum',
    'litecoin',
    'usdc',
    'ripple',
    'tether',
    'dogecoin',
  ]

  const confirmationRow = edit => {
    if (edit.name === 'confirmations') {
      if (isNaN(edit.new_value)) {
        toast.error('Confirmations must be a number')
        return false
      }
      return api
        .post('deposit/updateConfirmations', {
          confirmations: edit.new_value,
          depositId: edit.existing_src.id,
        })
        .then(() => {
          toast.success('Confirmations Updated')
          return true
        })
        .catch(err => {
          if (err) {
            toast.error(err.message)
          }
          return false
        })
    }
    toast.error('Cannot edit this field.')
    return false
  }

  const options = React.useMemo(
    () => ({
      expandableRows: true,
      expandableRowsHeader: false,
      expandableRowsOnClick: true,
      filter: true,
      setTableProps: () => ({
        size: 'small',
      }),

      renderExpandableRow: (rowData, { dataIndex }) => {
        const bet = data[dataIndex]
        const colSpan = rowData.length + 1
        const canEdit =
          cryptoDeposits.includes(bet.depositType) && canUpdateDeposits

        return (
          <TableRow className={classes.expandedRow}>
            <TableCell colSpan={colSpan}>
              <Paper style={{ padding: 16 }}>
                <ReactJson
                  theme={isDarkMode ? 'monokai' : undefined}
                  name="Deposit"
                  onEdit={canEdit ? confirmationRow : undefined}
                  src={bet}
                />
              </Paper>
            </TableCell>
          </TableRow>
        )
      },
    }),
    [data, classes.expandedRow],
  )

  const columns: MUIDataTableColumn[] = React.useMemo(
    () => [
      {
        name: 'createdAt',
        label: 'Date',
        options: {
          sort: true,
          customBodyRenderLite: dataIndex => {
            const date = createMoment(data[dataIndex].createdAt)
            return date.format('lll')
          },
          ...DateRangePickerFilter('Date'),
        },
      },
      {
        name: 'depositType',
        label: 'Type',
        sort: false,

        options: {
          customBodyRenderLite: dataIndex => {
            return (
              data[dataIndex].depositType || data[dataIndex].provider || 'N/A'
            )
          },
          filter: true,
          display: true,
          filterOptions: {
            names: providerList as Writable<typeof providerList>, // Please excuse the type assertion, but mui data table should accept readonly arrays...
          },
        },
      },
      {
        name: 'totalValue',
        label: 'Amount',
        options: {
          display: true,
          customBodyRenderLite: dataIndex => {
            return numeral(data[dataIndex].amount).format('$0,0.00')
          },
        },
      },
      {
        name: 'confirmations',
        label: 'Confs',
        options: {
          sort: true,
          filter: false,
        },
      },
      {
        name: 'status',
        label: 'Status',
        options: {
          sort: false,
          filter: false,
        },
      },
      {
        name: 'viewTransaction',
        label: 'View Transaction',
        options: {
          sort: false,
          customBodyRender: (_, { rowIndex }) => {
            const { meta } = data[rowIndex]

            if (!meta?.txHash) {
              return ''
            }

            return <ViewOnBlockchair hash={meta.txHash} />
          },
        },
      },
    ],
    [data],
  )

  const filterAssignments = [
    { key: 'createdAt', index: 0, dateRange: true },
    { key: 'depositType', index: 1 },
  ]

  return (
    <DataTable
      title="Deposits"
      data={data}
      columns={columns}
      options={options}
      exportUrl={`${env.API_URL}/admin/users/deposits/export?userId=${userData.user.id}`}
      serverSide={{
        setData,
        userId: userData.user.id,
        fetchUrl: 'admin/table/deposits',
        filters: filterAssignments,
      }}
      search={{
        label: 'Transaction ID',
        columns: ['meta.txHash'],
      }}
    />
  )
}
