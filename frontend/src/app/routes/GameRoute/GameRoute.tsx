import React from 'react'
import { useToggle } from 'react-use'
import { useSelector, shallowEqual } from 'react-redux'
import { Helmet } from 'react-helmet'
import { useQuery, useMutation } from '@apollo/client'
import { useMediaQuery } from '@mui/material'
import { theme as uiTheme } from '@project-atl/ui'
import clsx from 'clsx'

import {
  useAllFeatureFlags,
  useAppUpdate,
  useBusyDebounce,
  useParamsScrollTop,
  useTranslate,
} from 'app/hooks'
import { normalizeGame } from 'app/components/Game'
import { GameDesc, Leaderboard } from 'app/components'
import { capitalizeFirstLetter, isMobile } from 'app/util'
import { isSportsBettingGame } from 'app/constants/sportsbetting'
import {
  type TPGameData,
  GameToggleFavoriteMutation,
  TPGameQuery,
  type GameToggleFavoriteMutationData,
  type GameToggleFavoriteMutationVariables,
  CurrentUserFavoriteGamesQuery,
  type CurrentUserFavoriteGamesQueryData,
} from 'app/gql'
import { RecentlyPlayed } from 'app/components/RecentlyPlayed'
import { type TPGame, isNativeHouseGame } from 'common/types'
import { NUM_GAMES } from 'app/constants'

import GameFrameRouteView from './GameFrameRouteView'
import { GameEmbeddedRouteView } from './GameEmbeddedRouteView'
import { SportsbookLauncher } from './SportsbookLauncher'
import { type GameRouteViewProps } from './types'

import { useGameRouteStyles } from './GameRoute.styles'

export interface GameRouteProps {
  identifier?: string
  canFavorite?: boolean
  isHouseGame?: boolean
  match?: {
    params?: {
      name: string
    }
  }
}

const shouldHideBalance = (
  gameIdentifier: string,
  enabledFeatures: string[],
  isMobile: boolean,
): boolean => {
  if (isSportsBettingGame(gameIdentifier)) {
    return false
  }

  if (isNativeHouseGame(gameIdentifier, enabledFeatures)) {
    return false
  }

  if (!isMobile) {
    return false
  }

  return true
}

const shouldRenderViewFooterContent = (gameIdentifier: string): boolean => {
  if (isSportsBettingGame(gameIdentifier)) {
    return false
  }

  return true
}

const GameRouteSwitch: React.FC<GameRouteViewProps> = props => {
  if (isSportsBettingGame(props.gameIdentifier)) {
    return <SportsbookLauncher loading={props.loading} />
  }

  if (isNativeHouseGame(props.gameIdentifier, props.enabledFeatures)) {
    return <GameEmbeddedRouteView {...props} />
  }

  return <GameFrameRouteView {...props} />
}

const isGameFavorited = (favoriteGames: TPGame[], gameId: string): boolean => {
  return favoriteGames.some(game => game.identifier === gameId)
}

const GameRoute: React.FC<GameRouteProps> = props => {
  const { match, canFavorite = true } = props
  const gameIdentifier = match?.params?.name || props.identifier || ''

  const updateApp = useAppUpdate()
  const translate = useTranslate()

  const enabledFeatures = useAllFeatureFlags()

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isBlocked, setIsBlocked] = React.useState<boolean>(false)

  const [realMode, toggleRealMode] = useToggle(true)
  const [busy, setBusy] = useBusyDebounce()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const { isLoggedIn, userLoaded, countryCode, regionCountryCode } =
    useSelector(
      ({ user, settings }) => ({
        isLoggedIn: !!user,
        userLoaded: settings.loadedUser,
        countryCode: settings.countryCode,
        regionCountryCode: settings.regionCountryCode,
      }),
      shallowEqual,
    )

  const { data: currentUserData } = useQuery<CurrentUserFavoriteGamesQueryData>(
    CurrentUserFavoriteGamesQuery,
  )

  const [gameToggleFavoriteMutation] = useMutation<
    GameToggleFavoriteMutationData,
    GameToggleFavoriteMutationVariables
  >(GameToggleFavoriteMutation)

  const { data: gameInfo } = useQuery<TPGameData>(TPGameQuery, {
    variables: {
      type: isMobile() ? 'mobile' : 'desktop',
      gameIdentifier,
    },
    onError: error => {
      setErrorMessage(
        error?.message
          ? error.message
          : "We're having trouble loading this title.",
      )
    },
  })

  useParamsScrollTop()

  const favoriteGames = currentUserData
    ? currentUserData.currentUser.favoriteGames
    : null
  const favorited = favoriteGames
    ? isGameFavorited(favoriteGames || [], gameIdentifier)
    : null
  const classes = useGameRouteStyles({
    realMode,
    favorited,
  })

  const game = React.useMemo(() => {
    return gameInfo?.tpGame ? normalizeGame(gameInfo.tpGame, 'game') : null
  }, [gameInfo?.tpGame])

  // Reset error message when logged in.
  React.useEffect(() => {
    if (isLoggedIn) {
      setErrorMessage(null)
    }
  }, [isLoggedIn])

  // Default to fun play if user is logged out.
  React.useEffect(() => {
    if (!userLoaded) {
      return
    }

    if (!isLoggedIn && game?.hasFunMode) {
      toggleRealMode(false)
    }
  }, [userLoaded, isLoggedIn, toggleRealMode, game?.hasFunMode])

  // Hide balance, if applicable.
  React.useEffect(() => {
    if (shouldHideBalance(gameIdentifier, enabledFeatures, isTabletOrDesktop)) {
      updateApp(app => {
        app.hideBalance = true
      })
    }

    return () => {
      updateApp(app => {
        app.hideBalance = false
      })
    }
  }, [updateApp, gameIdentifier, enabledFeatures, isTabletOrDesktop])

  // Toggle isBlocked.
  React.useEffect(() => {
    if (!realMode && game?.hasFunMode === true) {
      setIsBlocked(false)
      return
    }

    if (game && (game?.blacklist?.length ?? 0) > 0) {
      const isCountryBlocked = countryCode
        ? game.blacklist.includes(countryCode)
        : true
      const isRegionBlocked = regionCountryCode
        ? [...game.blacklist, 'CA-ON'].includes(regionCountryCode)
        : false

      if (isCountryBlocked || isRegionBlocked) {
        setIsBlocked(true)
        setBusy(false)
      }
    }
  }, [
    realMode,
    game,
    countryCode,
    regionCountryCode,
    setBusy,
    isLoggedIn,
    userLoaded,
  ])

  const toggleFavoriteStatus = React.useCallback(async () => {
    if (!game || !currentUserData?.currentUser) return

    const { identifier: gameId } = game
    const { id: userId, favoriteGames } = currentUserData.currentUser
    const currentFavoriteGames = favoriteGames || []

    const isCurrentlyFavorited = isGameFavorited(currentFavoriteGames, gameId)

    // Update the favorite games list.
    // If the game is currently a favorite, remove it.
    // Otherwise, add it to the list.
    const updatedFavoriteGames = isCurrentlyFavorited
      ? currentFavoriteGames.filter(game => game.identifier !== gameId)
      : [...currentFavoriteGames, game]

    try {
      // Toggle the favorite status on the server
      await gameToggleFavoriteMutation({
        variables: {
          gameIdentifier: gameId,
          isFavorite: !isCurrentlyFavorited,
        },
        optimisticResponse: {
          gameToggleFavorite: {
            user: {
              id: userId,
              favoriteGames: updatedFavoriteGames.map(game => ({
                ...game,
                __typename: 'TPGame',
              })),
              __typename: 'User',
            },
          },
        },
      })
    } catch (error) {
      console.error(error)
    }
  }, [currentUserData, game, gameToggleFavoriteMutation])

  const loading = (() => {
    if (!busy && gameIdentifier && userLoaded && game) {
      return false
    }
    if (errorMessage && !game && !busy) {
      return false
    }
    return true
  })()

  const gameRouteViewProps: GameRouteViewProps = {
    game,
    errorMessage,
    setErrorMessage,
    toggleFavorited: canFavorite && isLoggedIn ? toggleFavoriteStatus : null,
    favorited,
    realMode: isLoggedIn && realMode, // cannot play realMode if not logged in
    toggleRealMode,
    isBlocked,
    loading,
    gameIdentifier,
    enabledFeatures,
  }
  const renderFooterContent = shouldRenderViewFooterContent(gameIdentifier)

  return (
    <>
      <div className={clsx({ [classes.GameRoute]: renderFooterContent })}>
        <div
          className={clsx({
            [classes.GameRouteContainer]: renderFooterContent,
          })}
        >
          {game && (
            <Helmet>
              <title>
                {game.identifier === 'slotegrator:sportsbook-1'
                  ? `${translate('gameRoute.sportsbookTitle')} - ${translate(
                      'gameRoute.sportsbook',
                    )}`
                  : translate('gameRoute.title', {
                      title: game.title,
                      provider: capitalizeFirstLetter(game.provider),
                    })}
              </title>
              <meta
                name="description"
                content={translate('gameRoute.description', {
                  title: game.title,
                  provider: capitalizeFirstLetter(game.provider),
                  numGames: NUM_GAMES,
                })}
              />
            </Helmet>
          )}
          <GameRouteSwitch {...gameRouteViewProps} />
          {renderFooterContent && (
            <>
              <div className={classes.descDesktop}>
                <GameDesc game={game} />
                <Leaderboard gameId={gameIdentifier} />
              </div>
            </>
          )}{' '}
        </div>
      </div>
      <RecentlyPlayed />
    </>
  )
}

export default React.memo(GameRoute)
