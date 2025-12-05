import React from 'react'
import numeral from 'numeral'
import moment from 'moment'
import { type MUIDataTableColumn } from 'mui-datatables'

import { DataTable } from 'mrooi'
import { useConfirm } from 'common/hooks'
import { Username, withRulesAccessController } from 'admin/components'
import { env } from 'common/constants'
import { api } from 'common/util'

import { useSponsorsRouteStyles } from './SponsorsRoute.styles'

const options = {
  filter: true,
  setTableProps: () => ({
    size: 'small',
  }),
}

const Balance = ({
  balanceType,
  balance,
  changeBalance,
  userId,
  updateValue,
}) => {
  const classes = useSponsorsRouteStyles()
  const addValue = incr =>
    updateValue((balance ? parseFloat(balance) : 0) + incr)
  const resetValue = value => updateValue(value)

  return (
    <div className={classes.balance}>
      {numeral(balance).format('$0,0.00')}{' '}
      <span
        role="button"
        className={classes.balanceModifier}
        onClick={() => changeBalance(balanceType, userId, addValue, 'add')}
      >
        Add
      </span>
      <span
        role="button"
        className={classes.balanceModifier}
        onClick={() => changeBalance(balanceType, userId, resetValue, 'reset')}
      >
        Reset
      </span>
    </div>
  )
}

const balanceOptions = (balanceType, changeBalance) => ({
  options: {
    sort: true,
    filter: false,
    customBodyRender: (balance, { rowData }, updateValue) => (
      <Balance
        balanceType={balanceType}
        balance={balance}
        changeBalance={changeBalance}
        updateValue={updateValue}
        userId={rowData[0]}
      />
    ),
  },
})

const getColumns = ({ changeBalance }): MUIDataTableColumn[] => [
  {
    name: 'id',
    label: 'ID',
    options: {
      display: false,
      filter: false,
    },
  },
  {
    name: 'name',
    label: 'Username',
    options: {
      customBodyRender: username => <Username username={username} />,
      filter: false,
    },
  },
  {
    name: 'balance',
    label: 'BTC Balance',
    ...balanceOptions('crypto', changeBalance),
  },
  {
    name: 'ethBalance',
    label: 'ETH Balance',
    ...balanceOptions('eth', changeBalance),
  },
  {
    name: 'ltcBalance',
    label: 'LTC Balance',
    ...balanceOptions('ltc', changeBalance),
  },
  {
    name: 'cashBalance',
    label: 'Cash Balance',
    ...balanceOptions('cash', changeBalance),
  },
  {
    name: 'lastBet',
    label: 'Last Bet Time',
    options: {
      sort: true,
      customBodyRender: val => (val ? moment(val).format('lll Z') : 'None'),
      filter: false,
    },
  },
  {
    name: 'howieDeal',
    label: 'Howie Deal',
    options: {
      sort: false,
      filter: false,
      customBodyRender: val => {
        if (!val) {
          return null
        }

        const { percent, total, remaining } = val

        return (
          <>
            <div>Percentage: {percent ? percent.toFixed(2) : 'N/A'}</div>
            <div>
              Total: {total ? numeral(total).format('$0,0.00[00]') : 'N/A'}
            </div>
            <div>
              Remaining:{' '}
              {remaining ? numeral(remaining).format('$0,0.00[00]') : 'N/A'}
            </div>
          </>
        )
      },
    },
  },
  {
    name: 'isInfluencer',
    label: 'Show Only Influencers',
    options: {
      display: false,
      sort: false,
      filter: true,
      filterType: 'checkbox',
      filterOptions: {
        names: ['Yes'],
      },
    },
  },
]

const DatatableActions = withRulesAccessController(['sponsors:read'], DataTable)

export const SponsorsRoute = () => {
  const confirm = useConfirm()
  const [data, setData] = React.useState([])

  const onFetch = (params, tableState) => {
    let endpoint = 'admin/table/users'

    setData([])

    const sortObj = {}
    const filterObj = {
      isSponsor: true,
    }

    if (tableState) {
      const { filterList, sortOrder } = tableState

      if (filterList) {
        const isInfluencerCol = columns.findIndex(
          col => col.name === 'isInfluencer',
        )
        const isInfluencerValue = filterList[isInfluencerCol]?.[0]

        if (isInfluencerValue) {
          endpoint = 'admin/table/influencers'
        }
      }

      if (!!sortOrder && sortOrder.name) {
        sortObj[sortOrder.name] = sortOrder.direction === 'desc' ? -1 : 1
      }
    }

    return api
      .post(endpoint, {
        ...params,
        filterObj,
        sortObj,
      })
      .then(result => {
        setData(result.data)
        return result
      })
  }

  const changeBalance = React.useCallback(
    async (balanceTypeOverride, userId, changeValueFn, type) => {
      try {
        const params = await confirm<{ amount: string; reason: string }>({
          title: 'Add Balance',
          message: 'Specify an amount and add a reason',
          inputs: [
            {
              type: 'number',
              key: 'amount',
              name: 'Amount',
            },
            {
              type: 'text',
              key: 'reason',
              name: 'Reason',
            },
          ],
        })

        if (!params) {
          return
        }

        // Send balance update request.
        const amount = parseFloat(params.amount)
        if (type === 'add') {
          await api.post('admin/user/addMarketing', {
            userId,
            balanceTypeOverride,
            amount,
            reason: params.reason,
          })
          changeValueFn(amount)
        }
        if (type === 'reset') {
          await api.post('admin/user/changeBalance', {
            userId,
            balanceTypeOverride,
            amount,
            reason: params.reason,
          })
          changeValueFn(amount)
        }
      } catch {
        // confirm throws an error on cancel... bc of course it does...
        // why don't we just managed our entire control flow with exceptions :(
      }
    },
    [confirm],
  )

  const columns = React.useMemo(
    () => getColumns({ changeBalance }),
    [changeBalance],
  )

  return (
    <DatatableActions
      title="Sponsors"
      data={data}
      columns={columns}
      options={options}
      exportUrl={`${env.API_URL}/admin/table/sponsors/export`}
      serverSide={{ onFetch }}
    />
  )
}
