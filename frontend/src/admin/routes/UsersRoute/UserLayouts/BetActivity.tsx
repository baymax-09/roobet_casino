import numeral from 'numeral'
import React from 'react'
import { Button, Typography } from '@mui/material'
import moment from 'moment'
import { useLazyQuery } from '@apollo/client'

import { betActivityQuery } from 'app/gql'
import { DataTable, DateRangePicker, Loading } from 'mrooi'
import { withRulesAccessController } from 'admin/components'
import { useAccessControl } from 'admin/hooks'
import { isHouseGame } from 'common/types'
import { useToasts } from 'common/hooks'

import { type UserData } from '../types'

import { useBetActivityStyles } from './BetActivity.styles'

interface BetActivityProps {
  userData: UserData
}

const requiredPermission = ['bets:read']
const ReadBetActivityDatatable = withRulesAccessController(
  requiredPermission,
  DataTable,
)

const baseURL = 'https://roobet.com'

const handleGameRedirects = (gameName: string, identifier: string) => {
  const redirectLinks = {
    cashdash: `/game/${identifier}`,
    linearmines: '/mission-uncrossable',
    hotbox: '/snoops-hotbox',
  }

  if (isHouseGame(gameName)) {
    return redirectLinks[gameName] || `/${gameName}`
  } else {
    return `/game/${identifier}`
  }
}

const searchOptions = {
  label: 'Title',
  columns: ['gameName', 'title'],
}

export const BetActivityLayout: React.FC<BetActivityProps> = ({ userData }) => {
  const { toast } = useToasts()
  const classes = useBetActivityStyles()

  const [selectedDateRange, setSelectedDateRange] = React.useState({
    start: moment().startOf('day').toISOString(),
    end: moment().endOf('day').toISOString(),
  })

  const { hasAccess: hasBetActivityAccess } =
    useAccessControl(requiredPermission)

  const [fetchBetActivity, { data: queryData, loading: queryLoading }] =
    useLazyQuery(betActivityQuery, {
      fetchPolicy: 'network-only',
      onError: error => {
        toast.error(`Error fetching bet activity: ${error.message}`)
      },
    })

  const runReport = () => {
    fetchBetActivity({
      variables: {
        userId: userData.user.id,
        startDate: selectedDateRange.start,
        endDate: selectedDateRange.end,
      },
    })
  }

  React.useEffect(() => {
    runReport()
  }, [userData.user.id])

  const options = {
    search: true,
    rowsPerPage: 25,
    caseSensitive: true,
    setTableProps: () => {
      return {
        size: 'small',
      }
    },
  }

  const columns = [
    {
      name: 'gameName',
      label: 'Aggregator',
      options: {
        filter: false,
        display: false,
      },
    },
    {
      name: 'title',
      label: 'Title',
      options: {
        filter: true,
        display: true,
        searchable: true,
        customBodyRender: (_, { rowData }) => {
          const link = handleGameRedirects(rowData[0], rowData[2])
          const redirectUrl = `${baseURL}${link}`
          return (
            <a
              key={rowData[2]}
              target="_blank"
              href={redirectUrl}
              rel="noreferrer"
              className={classes.Table__Redirect}
            >
              <Typography
                variant="h6"
                color="textPrimary"
                className={classes.Redirect__Title}
              >
                {rowData[1] ?? rowData[0]}
              </Typography>
            </a>
          )
        },
      },
    },
    {
      name: 'identifier',
      label: 'Identifier',
      options: {
        filter: false,
        display: false,
      },
    },
    {
      name: 'wagers',
      label: 'Wagers',
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value: any) => (
          <Typography>{numeral(value).format('0,0')}</Typography>
        ),
      },
    },
    {
      name: 'wagered',
      label: 'Wagered',
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value: any) => (
          <Typography>{numeral(value).format('$0,0.00')}</Typography>
        ),
      },
    },
    {
      name: 'avgWager',
      label: 'Average Wager',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value: any) => (
          <Typography>{numeral(value).format('$0,0.00')}</Typography>
        ),
      },
    },
    {
      name: 'payout',
      label: 'Payout',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value: any) => (
          <Typography>{numeral(value).format('$0,0.00')}</Typography>
        ),
      },
    },
    {
      name: 'ggr',
      label: 'GGR',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value: any) => (
          <Typography>{numeral(value).format('$0,0.00')}</Typography>
        ),
      },
    },
  ]

  const handleDateRangeChange = newDateRange => {
    setSelectedDateRange(newDateRange)
  }

  if (!hasBetActivityAccess) {
    return null
  }

  return (
    <div className={classes.Table__Root}>
      <div className={classes.Table__header}>
        <DateRangePicker
          selectedDateRange={selectedDateRange}
          onChange={handleDateRangeChange}
        />
        <div className={classes.button_Report}>
          <Button
            variant="contained"
            onClick={runReport}
            color="primary"
            size="large"
          >
            Run Report
          </Button>
        </div>
      </div>

      {queryLoading ? (
        <Loading />
      ) : (
        <ReadBetActivityDatatable
          title="Bet Activity"
          data={queryData?.playerBetActivity || []}
          columns={columns}
          options={options}
          search={searchOptions}
        />
      )}
    </div>
  )
}
