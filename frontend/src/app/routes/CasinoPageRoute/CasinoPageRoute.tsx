import React from 'react'
import { Helmet } from 'react-helmet'
import { useLocation } from 'react-router'
import { useQuery } from '@apollo/client'

import { ApolloCacheGameList } from 'app/components/GameList'
import { gamesPerPage } from 'app/constants'
import { useTranslate, useParamsScrollTop } from 'app/hooks'
import { type GameTagsResults } from 'common/types'
import { GameTagsQuery } from 'app/gql'
import { type GameFilters } from 'app/components/GameList/ApolloCacheGameList'
import { checkIfLobbyActive } from 'app/components/App/Nav/utils'
import { KOTHBanner } from 'app/components'

import { CASINO_LINKS } from './casinoLinks'
import { LobbyGameLists } from './LobbyGameLists'
import { CategoryButtons } from './CategoryButtons'

import { useGameListPageStyles } from 'app/components/GameList/GameListPage.styles'

const CasinoPageRoute: React.FC = () => {
  const classes = useGameListPageStyles()
  const translate = useTranslate()
  const location = useLocation()

  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const [searchHasValue, setSearchHasValue] = React.useState(false)

  const [tag, setTag] = React.useState('')

  const pageTitle = `${translate('casino.title')}`

  const lobbyActive = checkIfLobbyActive(location)

  // Only use for "Lobby"
  const { data: tagData, loading: loadingTags } = useQuery<GameTagsResults>(
    GameTagsQuery,
    {
      skip: !lobbyActive,
    },
  )

  const tags = tagData?.gameTags.filter(tag => tag.showOnHomepage) || []

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const searchParam = new URLSearchParams(url.search).get('category')

    const link = url.pathname + url.search

    if (CASINO_LINKS.includes(link)) {
      if (searchParam) {
        if (searchParam === 'livecasino') {
          setTag('live-casino-picks')
          return
        }
        setTag(searchParam)
        return
      }
      setTag('')
    }
  }, [window.location.search])

  useParamsScrollTop()

  const isSlots = tag === 'slots'
  // Need to switch to grid view for Casino "Lobby" page if user types a value into search input.
  const showLobbyGridGames = lobbyActive && searchHasValue

  const gamesFilter: GameFilters = {
    ...(isSlots
      ? {
          category: 'slots',
        }
      : {
          tagSlugs: showLobbyGridGames ? [] : [tag],
        }),
  }

  // Need to switch to grid view for Casino "Lobby" page if user types a value into search input.
  const handleChange = event => {
    const value = event.target.value
    setSearchHasValue(value.length > 0)
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle + ' ' + translate('gameList.games')}</title>
        <meta
          name="description"
          content={translate('gameList.providerMetaDesc') + ' ' + pageTitle}
        />
      </Helmet>
      <div className={classes.GameListPage}>
        <div className={classes.GameListPage__container}>
          <ApolloCacheGameList
            tags={tag}
            gamesFilter={gamesFilter}
            pageSize={gamesPerPage}
            useGameListCollateProps={{
              includeProviderFilter: true,
              searchProps: {
                searchText: translate('casino.searchGames'),
                inputRef: searchInputRef,
                onChange: handleChange,
              },
              ...(lobbyActive && {
                includeProviderFilter: false,
                includeSortFilter: false,
              }),
            }}
            {...(lobbyActive &&
              !searchHasValue && {
                customRendering: (
                  <LobbyGameLists tags={tags} loading={loadingTags} />
                ),
                loading: loadingTags,
              })}
          >
            <CategoryButtons />
            {tag === 'slots' && <KOTHBanner page={tag} />}
          </ApolloCacheGameList>
        </div>
      </div>
    </>
  )
}

export default React.memo(CasinoPageRoute)
