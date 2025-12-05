import React from 'react'
import { useQuery } from '@apollo/client'
import { Redirect } from 'react-router'

import { type GameTagConfiguration, gamesPerPage } from 'app/constants'
import { ApolloCacheGameList, GameTagView } from 'app/components/GameList'
import {
  CurrentUserFavoriteGamesQuery,
  type CurrentUserFavoriteGamesQueryData,
} from 'app/gql/user'
import { useIsLoggedIn, useTranslate } from 'app/hooks'
import { useToasts } from 'common/hooks'

export const GameFavoritesRoute: React.FC = () => {
  const translate = useTranslate()
  const { toast } = useToasts()
  const isLoggedIn = useIsLoggedIn()

  const GAME_TAGS_FAVORITES: GameTagConfiguration = {
    // t('gameList.favorites')
    title: translate('gameList.favorites'),
    path: 'favorites',
    pageSize: gamesPerPage,
    options: {
      includeRecommendedSort: false,
    },
  }

  const { data, loading } = useQuery<CurrentUserFavoriteGamesQueryData>(
    CurrentUserFavoriteGamesQuery,
    {
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  if (!isLoggedIn) {
    return <Redirect to="/" />
  }

  const favoriteGames = data?.currentUser.favoriteGames

  return (
    <GameTagView list={GAME_TAGS_FAVORITES}>
      <ApolloCacheGameList
        loading={loading}
        pageSize={gamesPerPage}
        useGameListCollateProps={{
          includeRecommendedSort: false,
          searchProps: {
            // t('gameList.providerSearch')
            searchText: translate('gameList.providerSearch', {
              provider: GAME_TAGS_FAVORITES.title,
            }),
          },
        }}
        overrideGames={favoriteGames}
        gamesFilter={{}}
      />
    </GameTagView>
  )
}
