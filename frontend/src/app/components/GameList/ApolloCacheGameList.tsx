import React from 'react'
import Fuse from 'fuse.js'
import moment from 'moment'
import { useMediaQuery } from '@mui/material'
import { theme as uiTheme } from '@project-atl/ui'

import { isMobile } from 'app/util'
import { type TPGame, type TPGameEssential } from 'common/types'
import { normalizeGameEssential } from 'app/components/Game'
import { useGames } from 'app/context'

import {
  useGameListCollate,
  type useGameListCollateArgs,
} from './useGameListCollate'
import GameListView, { type GameListViewProps } from './GameListView'

// TODO: May make into hook ---
export interface GameFilters {
  providers?: string[]
  tagSlugs?: string[]
  category?: string
  /**
   * Usually used to filter by provider on the provider pages.
   */
  overrideProvider?: string
}

interface FilterGameProps extends GameFilters {
  game: TPGameEssential
}

const filterGame = ({
  game,
  tagSlugs,
  category,
  overrideProvider,
}: FilterGameProps) => {
  const containsProvider = overrideProvider
    ? overrideProvider.toLowerCase() === game.provider.toLowerCase()
    : true

  const device = isMobile() ? 'mobile' : 'desktop'
  const containsDevice = game.devices.includes(device)
  const containsTagSlugs =
    tagSlugs && tagSlugs.length
      ? game?.tags?.some(tag => tagSlugs.includes(tag.slug))
      : true
  const containsCategory = category
    ? game.category.toLowerCase() === category
    : true

  return (
    containsProvider && containsDevice && containsTagSlugs && containsCategory
  )
}

export interface GameListProps
  extends Omit<
    GameListViewProps,
    'gameListComponents' | 'gameData' | 'defaultProviders'
  > {
  includeRecommendedSort?: boolean
  tags?: string | null
  overrideProvider?: string
  useGameListCollateProps?: useGameListCollateArgs
  children?: React.ReactNode
  customRendering?: React.ReactNode
  gamesFilter?: GameFilters
  loading?: boolean
  overrideGames?: TPGame[]
  /**
   * Flag to display specific games specified in the "gamesFilter" prop, when no collation being used.
   */
  showSpecificGamesWithNoCollate?: boolean
}

const ApolloCacheGameList: React.FC<
  React.PropsWithChildren<GameListProps>
> = props => {
  const {
    tags,
    showCollate = true,
    overrideProvider,
    useGameListCollateProps,
    gamesFilter,
    loading = false,
    // Only use if absolutely need to
    overrideGames,
    children,
    showSpecificGamesWithNoCollate = false,
  } = props

  const { includeRecommendedSort = false } = props.useGameListCollateProps ?? {}
  const defaultSort = includeRecommendedSort ? 'recommended' : 'pop_desc'
  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'), {
    noSsr: true,
  })

  const gameListComponents = useGameListCollate({
    includeRecommendedSort,
    defaultSort,
    includeProviderFilter: !overrideProvider,
    ...(isDesktop && {
      sortWidth: 240,
      providerWidth: 288,
    }),
    ...useGameListCollateProps,
  })

  const { games: gameEssentials, loading: loadingGameEssentials } = useGames()

  const finalGames = overrideGames ?? gameEssentials

  const noCollateOptionSelected =
    (gameListComponents.collate.sort === 'pop_desc' ||
      (includeRecommendedSort &&
        gameListComponents.collate.sort === 'recommended')) &&
    gameListComponents.collate.filters.providers.length === 0 &&
    gameListComponents.collate.searchTerm === ''

  const showSpecificGames =
    showSpecificGamesWithNoCollate && noCollateOptionSelected

  const processGames = (games: TPGameEssential[], gameFilters: GameFilters) => {
    const finalGameFilters =
      showSpecificGamesWithNoCollate && !showSpecificGames ? {} : gameFilters

    const filteredGames = games
      .filter(game =>
        filterGame({ game, ...finalGameFilters, overrideProvider }),
      )
      .map(game => normalizeGameEssential(game, 'game'))

    const sort = gameListComponents.collate.sort

    if (sort) {
      if (sort === 'title_asc') {
        filteredGames.sort((a, b) => a.title.localeCompare(b.title))
        /** How we want "Popular" to should be sorted:
         * Favorites - Sort by last game the user favorited
         * Roobet Games, Popular Games, Live Casino, Blackjack, Baccarat - Obey the tag ordering from games manager
         * Slots - Popularity on game record desc
         */
      } else if (sort === 'pop_desc') {
        if (tags?.includes('favorites')) {
          filteredGames.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
        } else if (!tags?.includes('slots')) {
          // Sorting games by their tag priorities.
          if (finalGameFilters && finalGameFilters.tagSlugs) {
            const tagId: string | null = filteredGames.reduce<string | null>(
              (acc, game) => {
                const tag = game.tags.find(
                  tag => finalGameFilters.tagSlugs?.includes(tag.slug),
                )
                if (tag) {
                  return tag.id
                }
                return acc
              },
              null,
            )

            if (tagId) {
              filteredGames.sort(
                (
                  { tagPriorities: tpA = {}, tags: tagA },
                  { tagPriorities: tpB = {} },
                ) => {
                  const priorityA = tpA?.[tagId] ?? 0
                  const priorityB = tpB?.[tagId] ?? 0
                  return priorityA - priorityB
                },
              )
            }
          }
        } else {
          filteredGames.sort(
            (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0),
          )
        }
      } else if (sort === 'title_desc') {
        filteredGames.sort((a, b) => b.title.localeCompare(a.title))
      } else if (sort === 'releasedAt') {
        filteredGames.sort((a, b) =>
          moment(b.releasedAt).diff(moment(a.releasedAt)),
        )
      }
    }
    return filteredGames
  }

  const fuse = React.useMemo(() => {
    const fuseOptions = {
      threshold: 0.2, // 0.0 is a perfect match, 1.0 is a complete mismatch
      keys: ['title'],
    }
    return new Fuse(finalGames, fuseOptions)
  }, [finalGames])

  const games = React.useMemo(() => {
    const searchTerm = gameListComponents.collate.searchTerm
    const providers = overrideProvider
      ? [overrideProvider]
      : gameListComponents.collate.filters.providers

    if (searchTerm.trim().length > 0) {
      // If there is a search term, use the fuse search
      return processGames(
        fuse.search(searchTerm).map(result => result.item),
        { providers, ...(gamesFilter && { ...gamesFilter }) },
      )
    }
    // If there is no search term, but there are providers, display all games from those providers
    return processGames(finalGames, {
      providers,
      ...(gamesFilter && { ...gamesFilter }),
    })
  }, [
    fuse,
    gameListComponents?.collate?.sort,
    gameListComponents?.collate?.filters?.providers,
    gameListComponents?.collate?.searchTerm,
    finalGames,
    gamesFilter,
  ])

  const gameData = {
    games: showSpecificGames ? gameEssentials : games,
    tags,
    viewableGames: showSpecificGames ? games : undefined,
  }

  const stillLoading = loadingGameEssentials || loading

  return (
    <GameListView
      showCollate={showCollate}
      gameListComponents={gameListComponents}
      gameData={gameData}
      defaultProviders={{ loading: false }}
      hideBottomActions={false}
      // We want to hide this component visually when the game cache is loading
      // not actually unmount it.
      overrideLoading={stillLoading}
      {...props}
    >
      {children}
    </GameListView>
  )
}

export default React.memo(ApolloCacheGameList)
