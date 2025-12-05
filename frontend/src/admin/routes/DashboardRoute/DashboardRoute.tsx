import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Line } from 'react-chartjs-2'
import ReactJson from 'react-json-view'
import moment from 'moment'
import {
  Button,
  MenuItem,
  type Theme,
  Typography,
  useMediaQuery,
} from '@mui/material'

import { useAxiosGet } from 'common/hooks'
import { useDarkMode } from 'admin/context'
import { Loading, MultiSelect, DateRangePicker } from 'mrooi'
import { useAccessControl } from 'admin/hooks'
import { isArrayOfStrings } from 'common/util'

import { useDashboardRouteStyles, colorArray } from './DashboardRoute.styles'

interface StatList {
  day: string
  dayNumber: number
  id: string
  // a bunch of arbitrary data from backend, don't care about actual keys
  [x: string]: unknown
}

interface GetStatsResponse {
  statsList: StatList[]
  today: StatList
  yesterday: StatList
}

interface DataSet {
  borderColor: string[]
  fill: boolean
  label: string
  data: Record<string, unknown>
}
interface ChartData {
  labels: string[]
  datasets: DataSet[]
}
const chartOptions = {
  // global chartjs options
  maintainAspectRatio: false,
}

/**
 * Consists of 3 keys:
 * Each entry represents a value returned in the quicklooks
 * "betAmountKey" should correspond to the amount bet for the particular quicklook value
 * "winningsAmountKey" is the same but for the amount won i.e. paid out
 * "name" is simply the value of the key in the quicklook object
 *
 *  Add new values here to change the quicklook objects
 */
const defaultQuickLookKeys = [
  {
    betAmountKey: 'deposited',
    winningsAmountKey: 'withdrawn',
    name: 'depositWithdrawProfit',
  },
  {
    betAmountKey: 'rouletteBet',
    winningsAmountKey: 'rouletteWon',
    name: 'rouletteProfit',
  },
  {
    betAmountKey: 'crashBet',
    winningsAmountKey: 'crashWon',
    name: 'crashProfit',
  },
  {
    betAmountKey: 'diceBet',
    winningsAmountKey: 'diceWon',
    name: 'diceProfit',
  },
  {
    betAmountKey: 'minesBet',
    winningsAmountKey: 'minesWon',
    name: 'minesProfit',
  },
  {
    betAmountKey: 'towersBet',
    winningsAmountKey: 'towersWon',
    name: 'towersProfit',
  },
  {
    betAmountKey: 'towersBet',
    winningsAmountKey: 'towersWon',
    name: 'towersProfit',
  },
  {
    betAmountKey: 'softswissBet',
    winningsAmountKey: 'softswissWon',
    name: 'softswissProfit',
  },
  {
    betAmountKey: 'redtigerBet',
    winningsAmountKey: 'redtigerWon',
    name: 'redtigerProfit',
  },
  {
    betAmountKey: 'pragmaticBet',
    winningsAmountKey: 'pragmaticWon',
    name: 'pragmaticProfit',
  },
  {
    betAmountKey: 'playngoBet',
    winningsAmountKey: 'playngoWon',
    name: 'playngoProfit',
  },
]

const chartDatasetOptions = {
  // extra chartjs options for datasets -- this gets injected into each dataset
  // https://www.chartjs.org/docs/latest/charts/line.html
  fill: false,
}

const pickRandomColor = () => {
  return colorArray[Math.floor(Math.random() * colorArray.length)]
}

const generateSingleDayQuickLook = src => {
  if (src.length === 0) {
    return {}
  }

  const returnData = {}
  for (const i of defaultQuickLookKeys) {
    try {
      const bets = src[i.betAmountKey]
      const winnings = src[i.winningsAmountKey]
      returnData[i.name] = bets - winnings
    } catch (error) {
      console.error('An error occurred generating a quicklook:', error)
    }
  }
  return returnData
}

const getXAxisFromData = (statsList, isDesktop) => {
  const newXAxis: string[] = []
  for (const i of statsList) {
    if (!isDesktop) {
      newXAxis.push(moment(i.day).format('M/D/YY'))
    } else {
      newXAxis.push(moment(i.day).format('ll'))
    }
  }
  return newXAxis
}

export const DashboardRoute: React.FC = () => {
  const classes = useDashboardRouteStyles()
  const [isDarkMode] = useDarkMode()
  const { hasAccess: hasGlobalStatsAccess } = useAccessControl([
    'global_stats:read',
  ])
  const [selectedKeys, setSelectedKeys] = useState([
    'deposits',
    'withdrawals',
    'uniqueDeposits',
  ])
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: moment().subtract(30, 'days').toISOString(),
    end: moment().subtract(1, 'days').toISOString(),
  })
  const isDesktop = useMediaQuery<Theme>(theme => theme.breakpoints.up('md'), {
    noSsr: true,
  })

  const [{ data }, refetch] = useAxiosGet<GetStatsResponse>(
    `/admin/stats/getStatsDateRange?startDate=${selectedDateRange.start}&endDate=${selectedDateRange.end}`,
  )
  const availableKeys = data?.today ? Object.keys(data.today) : []

  const handleDateRangeChange = newDateRange => {
    setSelectedDateRange(newDateRange)
  }

  const formattedChartData = React.useMemo(() => {
    if (!data?.statsList) {
      return {}
    }

    const { statsList } = data
    const xAxis = getXAxisFromData(statsList, isDesktop)
    const chartData: ChartData = {
      labels: xAxis,
      datasets: [],
      // more will be added by below code
    }

    const parsedData = {}
    for (const date of statsList) {
      for (const key of selectedKeys) {
        if (!parsedData[key]) {
          parsedData[key] = []
        }

        parsedData[key].push(date[key])
      }
    }

    let count = 0
    for (const key of Object.keys(parsedData)) {
      const value = parsedData[key]

      // construct in chart js format
      chartData.datasets.push({
        ...chartDatasetOptions,
        label: key,
        data: value,
        borderColor: [
          count < colorArray.length ? colorArray[count] : pickRandomColor(),
        ],
      })

      count += 1
    }
    return chartData
  }, [data, isDesktop, selectedKeys])

  if (!hasGlobalStatsAccess) {
    return null
  }

  return (
    <div className={classes.root}>
      <Helmet title="Dashboard" />

      <div className={classes.refreshButtonContainer}>
        <Button
          variant="contained"
          onClick={() => refetch()}
          color="primary"
          size="large"
        >
          Refresh Data
        </Button>
      </div>

      <div className={classes.configContainer}>
        <div className={classes.selectContainer}>
          <Typography variant="h6" gutterBottom>
            Chart What You Want
          </Typography>
          <MultiSelect
            value={selectedKeys}
            onChange={(event, selectedElem) =>
              isArrayOfStrings(event.target.value)
                ? setSelectedKeys(event.target.value)
                : null
            }
          >
            {availableKeys ? (
              availableKeys.map((keyName, index) => (
                <MenuItem key={keyName} value={keyName}>
                  {keyName}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" />
            )}
          </MultiSelect>
        </div>

        <DateRangePicker
          selectedDateRange={selectedDateRange}
          onChange={handleDateRangeChange}
        />
      </div>

      <div className={classes.chart}>
        <Line data={formattedChartData} options={chartOptions} />
      </div>

      <div className={classes.quickLook}>
        <Typography variant="h6">Today Quick Look</Typography>

        <div className={classes.jsonView}>
          {data?.today ? (
            <ReactJson
              theme={isDarkMode ? 'monokai' : undefined}
              src={generateSingleDayQuickLook(data.today)}
              name="quickLookToday"
            />
          ) : (
            <Loading />
          )}
        </div>
      </div>

      <div className={classes.quickLook}>
        <Typography variant="h6">Today&apos;s Stats</Typography>

        <div className={classes.jsonView}>
          {data?.today ? (
            <ReactJson
              theme={isDarkMode ? 'monokai' : undefined}
              collapsed
              src={data.today}
              name="today"
            />
          ) : (
            <Loading />
          )}
        </div>
      </div>

      <div className={classes.quickLook}>
        <Typography variant="h6">Yesterday Quick Look</Typography>

        <div className={classes.jsonView}>
          {data?.yesterday ? (
            <ReactJson
              theme={isDarkMode ? 'monokai' : undefined}
              src={generateSingleDayQuickLook(data.yesterday)}
              name="quickLookYesterday"
            />
          ) : (
            <Loading />
          )}
        </div>
      </div>

      <div className={classes.quickLook}>
        <Typography variant="h6">Yesterday&apos;s Stats</Typography>

        <div className={classes.jsonView}>
          {data?.yesterday ? (
            <ReactJson
              theme={isDarkMode ? 'monokai' : undefined}
              collapsed
              src={data.yesterday}
              name="yesterday"
            />
          ) : (
            <Loading />
          )}
        </div>
      </div>
    </div>
  )
}
