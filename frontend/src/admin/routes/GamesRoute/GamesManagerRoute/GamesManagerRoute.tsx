import React, { useState } from 'react'
import { Tab, Tabs } from '@mui/material'

import { TitleContainer } from 'mrooi'

import { GameTagsRoute, TPGamesListRoute, TPGameCategoriesRoute } from '..'

import { useGameManagerRouteStyles } from './GamesManager.styles'

const LIST_TABS = ['Games', 'Categories', 'Tags'] as const
const isGameMangerTab = (tab: string): tab is (typeof LIST_TABS)[number] =>
  LIST_TABS.includes(tab as any)

export const GamesManagerRoute: React.FC = () => {
  const classes = useGameManagerRouteStyles()
  const [tableViewTab, setTableViewTab] =
    useState<(typeof LIST_TABS)[number]>('Games')

  const getSelectableViews = tab => {
    if (tab === 'Games') {
      return <TPGamesListRoute />
    }
    if (tab === 'Categories') {
      return <TPGameCategoriesRoute />
    }
    if (tab === 'Tags') {
      return <GameTagsRoute />
    }
  }

  React.useEffect(() => {
    const queryHash = window.location.hash
    const tab = queryHash.split('=')[1]
    if (isGameMangerTab(tab)) {
      setTableViewTab(tab)
    }
  }, [])

  return (
    <TitleContainer
      title={`Games Manager > ${tableViewTab}`}
      returnTo={undefined}
      actions={() => []}
    >
      <Tabs
        classes={{ root: classes.GameManager_addMarginBot }}
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
      {getSelectableViews(tableViewTab)}
    </TitleContainer>
  )
}
