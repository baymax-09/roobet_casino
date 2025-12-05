import React from 'react'
import i18n from 'i18next'
import { Tabs, Tab, Dropdown, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { useAxiosGet } from 'common/hooks'
import { normalizeBet } from 'app/util'
import { useTranslate, useLocale } from 'app/hooks'

import LeaderboardTab from './LeaderboardTab'
import LeaderboardLoadingSkeletons from './LeaderboardLoadingSkeletons'

import { useLeaderboardStyles } from './Leaderboard.styles'

// This must be in a closure so i18n can be initialized.
const getTabs = () => [
  {
    key: 'highestWins',
    name: i18n.t('leaderboard.tabHighest'),
  },
  {
    key: 'luckiestWins',
    name: i18n.t('leaderboard.tabLuckiest'),
  },
]

const getTimespanTabs = () => [
  {
    key: 'week',
    name: i18n.t('leaderboard.last7Days'),
  },
  {
    key: 'alltime',
    name: i18n.t('leaderboard.allTime'),
  },
]

interface LeaderboardProps {
  gameId: string
}

const Leaderboard: React.FC<LeaderboardProps> = ({ gameId }) => {
  const locale = useLocale()
  const translate = useTranslate()
  const classes = useLeaderboardStyles()
  const lastLight = React.useRef(true)
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const _tabs = React.useMemo(getTabs, [locale])
  const _timespanTabs = React.useMemo(getTimespanTabs, [locale])
  const [tab, setTab] = React.useState(0)
  const [timespanTab, setTimespanTab] = React.useState(1)

  const [{ data: bets, loading }] = useAxiosGet<{
    biggest: any
    luckiest: any
  }>(`/bet/leaderboards/${gameId}`)

  const currentTab = _tabs[tab]
  const currentTimespanTab = _timespanTabs[timespanTab]

  const displayData = React.useMemo(() => {
    if (currentTab.key === 'highestWins') {
      return bets?.biggest?.[currentTimespanTab.key] || []
    }

    if (currentTab.key === 'luckiestWins') {
      return bets?.luckiest?.[currentTimespanTab.key] || []
    }

    return []
  }, [bets, currentTab.key, currentTimespanTab.key])

  const normalizedBets = displayData.map(bet =>
    normalizeBet(bet, (lastLight.current = !lastLight.current)),
  )

  const handleOnChange = React.useCallback(
    event => {
      const { value } = event.target
      const index = _timespanTabs.findIndex(tab => tab.key === value)
      setTimespanTab(index)
    },
    [_timespanTabs],
  )

  return (
    <div>
      <div className={classes.LeaderBoard__board}>
        <div className={classes.LeaderBoard__banner}>
          <Tabs
            className={classes.Tabs}
            value={tab}
            onChange={(_, value) => setTab(value)}
          >
            {_tabs.map(t => (
              <Tab
                key={t.key}
                label={t.name}
                className={classes.LeaderBoard__tab}
              />
            ))}
          </Tabs>
          <div className={classes.Timespan}>
            <Dropdown
              color="secondary"
              sx={{ height: 40 }}
              value={currentTimespanTab.key}
              onChange={handleOnChange}
              displayValue={translate(currentTimespanTab.name)}
              {...(isTabletOrDesktop
                ? { dropdownWidth: 128 }
                : {
                    fullWidth: true,
                  })}
              menuOptions={_timespanTabs.map(({ name, key }) => ({
                name,
                value: key,
              }))}
            />
          </div>
        </div>
        {loading && <LeaderboardLoadingSkeletons />}
        {!loading && (
          <LeaderboardTab
            currentTab={currentTab}
            bets={normalizedBets}
            className={currentTab.key}
            gameId={gameId}
          />
        )}
      </div>
    </div>
  )
}

export default React.memo(Leaderboard)
