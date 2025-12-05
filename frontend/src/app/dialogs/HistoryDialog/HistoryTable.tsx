import React from 'react'
import { useMediaQuery } from '@mui/material'
import { Table, type Column, theme as uiTheme } from '@project-atl/ui'
import { Info } from '@project-atl/ui/assets'
import clsx from 'clsx'
import moment from 'moment'

import { useIsLoggedIn, useTranslate, useCurrencyFormatter } from 'app/hooks'
import { getBalanceTypeIcon } from 'common/util'
import { DialogToggle } from 'mrooi'
import {
  type BalanceType,
  balanceTypeToFullname,
  withdrawalPluginToBalanceType,
  depositTypeToBalanceType,
} from 'common/types'
import { useAxiosGet } from 'common/hooks'

import { typeMap } from './lib'

import { useHistoryTableStyles } from './HistoryTable.styles'

const FILTER_OPTIONS_KEYS = [
  'all',
  'bet',
  'payout',
  'deposit',
  'withdrawal',
  'bonus',
  'rain',
  'tip',
  'promo',
  'roowards',
  'survey',
]

interface HistoryTableProps {
  tab: number
  tabKey: string
  fetchUrl: string
  selectedFilterOption: string
  setSelectedFilterOption: React.Dispatch<React.SetStateAction<string>>
}

interface HistoryFetchParams {
  page?: number
  limit?: number
  type: string
  orderBy: null
  order: string | null
}
const HistoryTable: React.FC<HistoryTableProps> = ({
  tab,
  tabKey,
  fetchUrl,
  selectedFilterOption,
  setSelectedFilterOption,
}) => {
  const classes = useHistoryTableStyles()
  const isLoggedIn = useIsLoggedIn()
  const translate = useTranslate()
  const exchangeAndFormatCurrency = useCurrencyFormatter()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const [rowsState, setRowsState] = React.useState({
    page: 0,
    pageSize: 10,
    rows: [],
    rowCount: 0,
    loading: false,
    order: 'desc',
    orderBy: null,
  })

  const getBalanceType = React.useCallback(
    (row): BalanceType => {
      if (row.balanceType) {
        return row.balanceType
      }
      if (depositTypeToBalanceType[row.depositType]) {
        return depositTypeToBalanceType[row.depositType]
      }
      if (withdrawalPluginToBalanceType[row.plugin]) {
        return withdrawalPluginToBalanceType[row.plugin]
      }
      if (tabKey === 'deposits' || tabKey === 'withdrawals') {
        return 'cash'
      }
      return 'crypto'
    },
    [tabKey],
  )

  const [{ data, loading }, fetchHistoryData] = useAxiosGet<
    any,
    HistoryFetchParams
  >(fetchUrl, {
    lazy: true,
    onCompleted: response => {
      setRowsState(prev => ({
        ...prev,
        rowCount: response.count,
      }))
    },
  })

  const filterOptions = Object.fromEntries(
    new Map(
      Array.from(Object.entries(typeMap)).filter(([key]) =>
        FILTER_OPTIONS_KEYS.includes(key),
      ),
    ),
  )

  const depositsOrWithdrawalTabKey =
    tabKey === 'deposits' || tabKey === 'withdrawals'

  const bodyRows = React.useMemo(() => {
    if (data) {
      return data.data.map(row => {
        const cells: Array<{ key: string; data: React.ReactNode }> = []
        const timestamp = (() => {
          const date = moment(row.timestamp || row.updatedAt)
          return `${date.format('MM/DD/YY')} ${date.format('HH:mm:ss')}`
        })()

        cells.push({ key: 'timestamp', data: timestamp })

        if (!depositsOrWithdrawalTabKey) {
          const type = (() => {
            if (['bet', 'payout'].includes(row.type)) {
              if (!row.meta.gameName) {
                return `${
                  row.meta.incrementTotalWon ? 'payout' : typeMap[row.type]
                }`
              }
              return `${row.meta.gameName} ${
                row.meta.incrementTotalWon ? 'payout' : typeMap[row.type]
              }`
            }

            return row.gameNameDisplay || row.gameName || typeMap[row.type]
          })()
          cells.push({
            key: 'type',
            data: (
              <div className={classes.HistoryTableBody_ellipsis}>{type}</div>
            ),
          })
        }

        const balanceType = getBalanceType(row)

        cells.push({
          key: 'balanceType',
          data: (
            <div className={classes.HistoryTableBody__currency}>
              <img
                className={classes.HistoryTableBody__currencyIcon}
                alt={balanceType}
                src={getBalanceTypeIcon(balanceType)}
              />
              <span>{balanceTypeToFullname[balanceType]}</span>
            </div>
          ),
        })

        const amount = isNaN(row.amount)
          ? isNaN(row.profit)
            ? row.totalValue
            : row.profit
          : row.amount
        const amountFormatted = exchangeAndFormatCurrency(
          Math.abs(amount),
          '0,0.00',
        )

        // totalValue is defined ONLY in withdrawal object
        const isCompletedTransaction = row.status === 'completed'
        const isDepositRow = tabKey === 'deposits' && !loading
        const positive = amount > 0 && !row.totalValue
        const negative = !positive && !isDepositRow

        cells.push({
          key: 'amount',
          data: (
            <div
              className={clsx({
                [classes.HistoryTableBody__cell_positive]:
                  positive || (isCompletedTransaction && isDepositRow),
                [classes.HistoryTableBody__cell_negative]: negative,
                [classes.HistoryTableBody__cell_neutral]:
                  isDepositRow && !isCompletedTransaction,
              })}
            >
              {negative && tabKey !== 'withdrawals'
                ? `- ${amountFormatted}`
                : amountFormatted}
            </div>
          ),
        })

        cells.push({
          key: 'details',
          data: (
            <div className={classes.HistoryTableBody__details}>
              <DialogToggle
                dialog="historyDetails"
                params={{ params: { tabKey: `${tabKey}`, row } }}
                useIconButton
                size="small"
                variant="text"
                preventDialogClose
                sx={{ display: 'inline-flex' }}
              >
                <Info
                  width={16}
                  height={16}
                  className={classes.HistoryTableBody__detailsIcon}
                  iconFill={uiTheme.palette.neutral[300]}
                />
              </DialogToggle>
            </div>
          ),
        })

        return {
          key: row._id,
          cells,
        }
      })
    }
    return []
  }, [data])

  const columns = React.useMemo((): Column[] => {
    return [
      {
        field: 'timestamp',
        headerName: translate('historyTable.date'),
        width: !depositsOrWithdrawalTabKey ? 0.25 : 0.35,
        sort: true,
      },
      ...(!depositsOrWithdrawalTabKey
        ? [
            {
              field: 'type',
              headerName: translate('historyTable.type'),
              width: 0.2,
              filterOptions,

              overrides: {
                2: {
                  field: 'game',
                  headerName: translate('historyTable.game'),
                  width: 0.2,
                },
              },
            },
          ]
        : []),
      {
        field: 'currency',
        headerName: translate('historyTable.currency'),
        width: !depositsOrWithdrawalTabKey ? 0.2 : 0.25,
      },
      {
        field: 'amount',
        headerName: translate('historyTable.amount'),
        width: 0.2,
        overrides: {
          2: {
            field: 'profit',
            headerName: translate('historyTable.profit'),
            width: 0.2,
          },
        },
      },
      {
        field: 'details',
        headerName: translate('historyTable.details'),
        width: !depositsOrWithdrawalTabKey ? 0.15 : 0.2,
        alignText: 'center',
      },
    ]
  }, [tabKey, filterOptions])

  // Fetch history data on mount.
  React.useEffect(() => {
    fetchHistoryData({
      page: rowsState.page || undefined,
      limit: rowsState.pageSize !== 10 ? rowsState.pageSize : undefined,
      type: selectedFilterOption === 'all' ? '' : selectedFilterOption,
      orderBy: rowsState.orderBy,
      order: rowsState.order,
    })
  }, [
    fetchHistoryData,
    selectedFilterOption,
    rowsState.page,
    rowsState.pageSize,
    rowsState.orderBy,
    rowsState.order,
  ])

  // Reset page on tab change.
  React.useEffect(() => {
    setRowsState(prev => ({ ...prev, page: 0 }))
  }, [fetchUrl])

  return (
    <Table
      {...(!isTabletOrDesktop && { tableWidth: 696 })}
      rowsState={{ ...rowsState, rows: bodyRows, loading }}
      setRowsState={setRowsState}
      noResultsText={translate('table.noResults')}
      blurTable={!isLoggedIn}
      tableHeadProps={{
        columns,
        tab,
        selectedFilterOption,
        setSelectedFilterOption,
      }}
      tablePaginationProps={{
        locale: {
          pageText: translate('table.page'),
          ofText: translate('table.of'),
        },
      }}
    />
  )
}

export default React.memo(HistoryTable)
