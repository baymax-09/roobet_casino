import React from 'react'
import { useQuery } from '@apollo/client'

import {
  CurrentUserRecentGamesQuery,
  type CurrentUserRecentGamesQueryData,
} from 'app/gql'
import { useIsLoggedIn, useTranslate } from 'app/hooks'

import { GameThumbnails } from '../GameList/GameListView'
import { GameListViewContainer } from '../GameList/GameListViewContainer'

import { useRecentlyPlayedStyles } from './RecentlyPlayed.styles'

export const RecentlyPlayed: React.FC = () => {
  const classes = useRecentlyPlayedStyles()
  const isLoggedIn = useIsLoggedIn()
  const translate = useTranslate()

  const { data, loading } = useQuery<CurrentUserRecentGamesQueryData>(
    CurrentUserRecentGamesQuery,
    {
      skip: !isLoggedIn,
    },
  )

  const games = data?.currentUser.recentGames ?? []

  if (loading || !games.length) {
    return null
  }

  return (
    <div className={classes.RecentlyPlayedContainer}>
      <div className={classes.RecentlyPlayed}>
        <GameListViewContainer>
          <GameThumbnails
            preview={true}
            loading={false}
            pageSize={18}
            viewableGames={games}
            title={translate('gameRoute.recentlyPlayed')}
          />
        </GameListViewContainer>
      </div>
    </div>
  )
}
