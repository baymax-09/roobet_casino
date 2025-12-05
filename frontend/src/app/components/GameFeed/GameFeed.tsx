import React from 'react'
import { Tabs, Tab } from '@project-atl/ui'
import { useLocation } from 'react-router-dom'
import { type Location } from 'history'

import { useIsLoggedIn, useTranslate } from 'app/hooks'

import { GameFeedController } from './GameFeedController'

import { useGameFeedStyles } from './GameFeed.styles'

export const _tabs = [
  {
    key: 'all',
    // t('gameFeed.allBets')
    name: 'gameFeed.allBets',
    authRequired: false,
  },
  {
    key: 'highrollers',
    // t('gameFeed.highRollers')
    name: 'gameFeed.highRollers',
    authRequired: false,
  },
  {
    key: 'luckywins',
    // t('gameFeed.luckywins')
    name: 'gameFeed.luckywins',
    authRequired: false,
  },
  {
    key: 'user',
    // t('gameFeed.myBets')
    name: 'gameFeed.myBets',
    authRequired: true,
  },
] as const

const shouldShowBetFeed = (location: Location): boolean => {
  // Don't show game feed if showing Japanese landing page content
  if (location.pathname === '/jp') {
    return false
  }

  return true
}

const GameFeed: React.FC = () => {
  const classes = useGameFeedStyles()
  const translate = useTranslate()
  const location = useLocation()

  const isLoggedIn = useIsLoggedIn()

  const [tab, setTab] = React.useState(0)

  const currentTab = _tabs[tab]

  if (!shouldShowBetFeed(location)) {
    return null
  }

  return (
    <div className={classes.GameFeed}>
      <div className={classes.GameFeed__container}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          indicatorColor="primary"
          scrollButtons="auto"
          allowScrollButtonsMobile
          className={classes.GameFeed__tabs}
        >
          {_tabs
            .filter(tab => !tab.authRequired || isLoggedIn)
            .map(tab => (
              <Tab
                key={tab.key}
                label={translate(tab.name)}
                sx={{ minWidth: '8.5rem' }}
              />
            ))}
        </Tabs>
        <GameFeedController tabKey={currentTab.key} />
      </div>
    </div>
  )
}

export default React.memo(GameFeed)
