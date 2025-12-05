import React from 'react'
import MUIDataTable, {
  type MUIDataTableOptions,
  type MUIDataTableColumn,
} from 'mui-datatables'
import { Button, Tab, Tabs } from '@mui/material'
import moment from 'moment'
import numeral from 'numeral'
import { useHistory } from 'react-router-dom'

import { api, getShortFromBalanceType, isApiError, sortBy } from 'common/util'
import { DateRangePickerFilter, Loading, TitleContainer } from 'mrooi'
import { useAxiosGet, useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'
import { type Promotion } from 'common/types'

import { useListPromoRouteStyles } from './ListPromoRoute.styles'

const UpdateAccessButton = withRulesAccessController(['promos:update'], Button)
const DeleteAccessButton = withRulesAccessController(['promos:delete'], Button)

const LIST_TABS = ['Active', 'Expired'] as const

export const ListPromoRoute: React.FC = () => {
  const classes = useListPromoRouteStyles()
  const history = useHistory()
  const { toast } = useToasts()
  const [tableViewTab, setTableViewTab] = React.useState('Active')

  const [{ data, loading }, refetch] = useAxiosGet<Promotion[]>(
    '/promo/admin',
    {
      onError: error => toast.error(error.message),
    },
  )

  const deleteCode = async promoId => {
    try {
      await api.delete(`/promo/admin/${promoId}`)
      refetch()
      toast.success('Deleted code')
    } catch (err) {
      if (isApiError(err)) {
        toast.error(err.response.data)
      } else {
        toast.error('Unknown error deleting code.')
      }
    }
  }

  const expireCode = async promoId => {
    try {
      await api.patch(`/promo/admin/${promoId}`, {
        claimsRemainingUpdate: 0,
        expireTimeUpdate: 0,
      })
      refetch()
      toast.success('Expired code')
    } catch (err) {
      if (isApiError(err)) {
        toast.error(err.response.data)
      } else {
        toast.error('Unknown error expiring code.')
      }
    }
  }

  const formattedPromos = React.useMemo(() => {
    const sortedPromos = data ? data.sort(sortBy('startTime')) : []
    return sortedPromos.map(promo => {
      const depositAmount = promo.depositLimit
        ? `${
            promo.depositLimit.hours
              ? promo.depositLimit.hours + ' hours'
              : 'lifetime'
          } - $${promo.depositLimit.amount}`
        : 'No'

      const wagerAmount = promo.wagerLimit
        ? `${
            promo.wagerLimit.hours
              ? promo.wagerLimit.hours + ' hours'
              : 'Lifetime'
          } - $${promo.wagerLimit.amount}`
        : 'No'

      const depositCount = promo.depositCount
        ? `${
            promo.depositCount.hours
              ? promo.depositCount.hours + ' hours'
              : 'Lifetime'
          } - ${promo.depositCount.amount}`
        : 'No'

      return {
        id: promo.id,
        timestamp: moment(promo.timestamp).utc().format('MM/DD/YY HH:mm'),
        expiresAt: moment(promo.expiration).utc().format('MM/DD/YY HH:mm'),
        expired:
          promo.claimsRemaining <= 0 || moment(promo.expiration) < moment()
            ? 'Yes'
            : 'No',
        code: promo.code,
        amount: promo.roowardsBonus
          ? 'Roowards'
          : numeral(promo.claimAmount).format('$0,0.00'),
        claims: numeral(promo.originalClaims).format('0,0'),
        remaining: numeral(promo.claimsRemaining).format('0,0'),
        depositAmount,
        wagerAmount,
        depositCount,
        hasNotDeposited: promo.hasNotDeposited ? 'Yes' : 'No',
        mustBeAffiliated: promo.mustBeAffiliated ? 'Yes' : 'No',
        affiliate: promo.affiliateName ? promo.affiliateName : 'No',
        cxAffId: promo.cxAffId ? promo.cxAffId : 'N/A',
        balanceType: promo.roowardsBonus
          ? 'N/A'
          : getShortFromBalanceType(promo.balanceType),
      }
    })
  }, [data])

  const expiredFilterList = React.useCallback(() => {
    if (tableViewTab === 'Active') {
      return ['No']
    }

    if (tableViewTab === 'Expired') {
      return ['Yes']
    }

    return []
  }, [tableViewTab])

  const columns = React.useMemo(
    (): MUIDataTableColumn[] => [
      {
        name: 'id',
        label: 'ID',
        options: {
          display: false,
          filter: false,
        },
      },
      {
        label: 'Created At',
        name: 'timestamp',
        options: {
          ...DateRangePickerFilter(
            'Created At',
            (createdAt, [filters]) => {
              if (!filters) {
                return false
              }
              const before = filters.start
                ? moment(createdAt, 'MM/DD/YY HH:mm').isAfter(
                    moment(filters.start).startOf('day'),
                  )
                : true
              const after = filters.end
                ? moment(createdAt, 'MM/DD/YY HH:mm').isBefore(
                    moment(filters.end).endOf('day'),
                  )
                : true
              return !(before && after)
            },
            'MM/DD/YY HH:mm',
            false,
          ),
        },
      },
      {
        name: 'expired',
        label: 'Expired',
        options: {
          filterList: expiredFilterList(),
        },
      },
      {
        name: 'expiresAt',
        label: 'Expires At',
        options: {
          ...DateRangePickerFilter(
            'Expires At',
            (expiresAt, [filters]) => {
              if (!filters) {
                return false
              }
              const before = filters.start
                ? moment(expiresAt, 'MM/DD/YY HH:mm').isAfter(
                    moment(filters.start).startOf('day'),
                  )
                : true
              const after = filters.end
                ? moment(expiresAt, 'MM/DD/YY HH:mm').isBefore(
                    moment(filters.end).endOf('day'),
                  )
                : true
              return !(before && after)
            },
            'MM/DD/YY HH:mm',
            false,
          ),
        },
      },
      {
        name: 'code',
        label: 'Code',
      },
      {
        name: 'amount',
        label: 'Amount',
      },
      {
        name: 'claims',
        label: 'Claims',
      },
      {
        name: 'remaining',
        label: 'Claims Remaining',
      },
      {
        name: 'depositAmount',
        label: 'Deposit Amount',
        options: {
          display: false,
        },
      },
      {
        name: 'wagerAmount',
        label: 'Wager Amount',
        options: {
          display: false,
        },
      },
      {
        name: 'cxAffId',
        label: 'Cellxpert Aff Id',
        options: {
          display: false,
        },
      },
      {
        name: 'depositCount',
        label: 'Deposit Count',
        options: {
          display: false,
        },
      },
      {
        name: 'hasNotDeposited',
        label: 'Has Not Deposited',
        options: {
          display: false,
        },
      },
      {
        name: 'affiliate',
        label: 'Affiliate',
        options: {
          display: false,
        },
      },
      {
        name: 'balanceType',
        label: 'Balance Type',
      },
      {
        name: 'mustBeAffiliated',
        label: 'Must Be Affiliated',
        options: {
          display: false,
        },
      },
    ],
    [expiredFilterList],
  )
  const tableOptions: MUIDataTableOptions = {
    print: false,
    selectableRows: 'single',
    filter: true,
    customToolbarSelect: (selectedRows, displayData) => {
      if (!displayData.length || !selectedRows.data.length) {
        return null
      }

      const selectedRowIndex = selectedRows.data[0].index
      const dataArray = displayData[selectedRowIndex].data
      const id = dataArray[0]
      const row = formattedPromos?.find(promo => promo.id === id)

      const handleExpireClick = () => expireCode(row?.id)
      const handleDeleteClick = () => deleteCode(row?.id)

      return (
        <div>
          <UpdateAccessButton
            className={classes.ListPromoActions_addMargin}
            color="primary"
            variant="contained"
            onClick={handleExpireClick}
          >
            Expire
          </UpdateAccessButton>
          <DeleteAccessButton
            className={classes.ListPromoActions_addMargin}
            color="primary"
            variant="contained"
            onClick={handleDeleteClick}
          >
            Delete
          </DeleteAccessButton>
        </div>
      )
    },
  }

  return (
    <TitleContainer
      title="Promos"
      returnTo={undefined}
      actions={() => [
        {
          value: 'New Promo',
          variant: 'contained',
          onClick: () => history.push('/crm/promos/create'),
        },
      ]}
    >
      <Tabs
        className={classes.ListPromo_addMarginBot}
        indicatorColor="primary"
        value={tableViewTab}
        onChange={(_, newTab) => {
          setTableViewTab(newTab)
        }}
      >
        {LIST_TABS.map(tab => (
          <Tab key={tab} value={tab} label={tab} />
        ))}
      </Tabs>
      {loading ? (
        <Loading />
      ) : (
        <MUIDataTable
          title=""
          columns={columns}
          data={formattedPromos}
          options={tableOptions}
        />
      )}
    </TitleContainer>
  )
}
