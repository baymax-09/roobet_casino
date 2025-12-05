import { CircularProgress, useMediaQuery, type Theme } from '@mui/material'
import { theme as uiTheme } from '@project-atl/ui'
import clsx from 'clsx'
import React from 'react'
import { useFullscreen, useMeasure } from 'react-use'

import { useGameContainerCSSHeight } from 'app/components/Game/useGameContainerCSSHeight'
import { SlotPotatoGamepageBanner } from 'app/components/SlotPotato'
import { useLazyRoute } from 'app/hooks'
import { pragmatic } from 'app/util'
import { YGGDRASIL_PROVIDER_NAME, type DisplayCurrency } from 'common/constants'
import { type NormalizedTPGame } from 'common/types'

import GameLauncherContainer from './GameLauncherContainer'
import GameRouteFooter from './GameRouteFooter'
import { loadHacksaw } from './HacksawLauncher'
import { loadEmbeddedHouseGame } from './HouseGameLauncher'
import { loadHub88 } from './Hub88Launcher'
import { loadPlayngo } from './PlayngoLauncher'
import { loadSlotegratorSlots } from './SlotegratorSlotsLauncher/SlotegratorSlotsLauncher'
import { loadSoftswiss } from './SoftswissLauncher'
import { type SoftswissLaunchOptions } from './SoftswissLauncher/SoftswissLauncher'
import { loadYggdrasil } from './YggdrasilLauncher'
import { useUniboCookies } from './hooks'
import { getExternalGameFrameUrl, type ExternalGameFrameResponse } from './lib'
import { type GameRouteViewProps } from './types'
import { GameViewMode, useGameViewModeState } from './useGameViewModeState'

import { useGameRouteStyles } from './GameRoute.styles'

interface LoadGameFrameURLArgs {
  realMode: boolean
  game: NormalizedTPGame
  isMobile: boolean
  locale: string
  setErrorMessage?: React.Dispatch<React.SetStateAction<string | null>>
  countryCode: string | null
  displayCurrency?: DisplayCurrency
}

interface ExternalURLResponse {
  url: string | SoftswissLaunchOptions | null | undefined
  supportedCurrencies?: DisplayCurrency[]
}

// load game url into window, avoid iframe ux issues
// TODO: Mobile as its own component
export const loadGameFrame = async ({
  realMode,
  game,
  isMobile,
  locale,
  countryCode,
  displayCurrency,
  setErrorMessage,
}: LoadGameFrameURLArgs): Promise<ExternalGameFrameResponse | undefined> => {
  const gameCurrency = displayCurrency ?? 'usd'
  const externalUrl = await (async (): Promise<ExternalURLResponse> => {
    if (game.aggregator === 'playngo') {
      return loadPlayngo(game.gid, realMode, isMobile, locale)
    }

    if (game.aggregator === 'pragmatic') {
      return pragmatic.createUrl(
        game.gid,
        realMode,
        isMobile,
        locale,
        countryCode,
        gameCurrency,
      )
    }

    if (game.aggregator === 'hub88') {
      return loadHub88(game.identifier, realMode, isMobile, gameCurrency)
    }

    if (game.aggregator === 'hacksaw') {
      return loadHacksaw(game, realMode, isMobile, gameCurrency)
    }

    if (game.aggregator === YGGDRASIL_PROVIDER_NAME) {
      return loadYggdrasil(game, isMobile)
    }

    if (game.aggregator === 'softswiss') {
      return loadSoftswiss(
        game.identifier,
        realMode,
        isMobile,
        gameCurrency,
        setErrorMessage!,
      )
    }

    if (game.aggregator === 'slotegrator') {
      return loadSlotegratorSlots(game, realMode, gameCurrency)
    }

    if (game.aggregator === 'roobet') {
      const nonce = `${Date.now()}`

      return loadEmbeddedHouseGame(game, realMode, isMobile, locale, nonce)
    }
    return { url: undefined }
  })()

  if (!externalUrl.url) {
    console.error('Unknown game type: ', game)
    return undefined
  }
  // @ts-expect-error already checked for "undefined" on "url"
  return getExternalGameFrameUrl(externalUrl, game.aggregator === 'softswiss')
}

const GameFrameRouteView: React.FC<GameRouteViewProps> = ({
  game,
  errorMessage,
  setErrorMessage,
  toggleFavorited,
  favorited,
  realMode,
  toggleRealMode,
  loading,
  isBlocked,
}) => {
  const [gameRef, { height }] = useMeasure()
  const gameWrapperRef = React.useRef<HTMLDivElement | null>(null)
  const gameFrameRef = React.useRef<HTMLDivElement | null>(null)

  const { viewMode, setViewMode } = useGameViewModeState()

  // Finish route transition once this component has rendered.
  const { done: lazyRouteDone } = useLazyRoute()

  // Set the needed Unibo Cookies to load the Unibo overlay
  useUniboCookies(game?.identifier)

  const isTabletOrDesktop = useMediaQuery<Theme>(
    () => uiTheme.breakpoints.up('md'),
    {
      noSsr: true,
    },
  )

  const containerCSSHeight = useGameContainerCSSHeight()
  const containerStyle =
    viewMode === GameViewMode.Theatre
      ? { height: containerCSSHeight }
      : undefined
  useFullscreen(gameWrapperRef, viewMode === GameViewMode.FullScreen, {
    onClose: () => setViewMode(GameViewMode.Regular),
  })

  const classes = useGameRouteStyles({
    realMode,
    favorited,
  })

  const updateViewMode = React.useCallback(
    (newMode: GameViewMode) => {
      if (viewMode === newMode) {
        setViewMode(GameViewMode.Regular)
        return
      }

      setViewMode(newMode)
    },
    [viewMode],
  )

  // Finish route transition when loading is complete.
  React.useEffect(() => {
    if (!loading) {
      lazyRouteDone()
    }
  }, [lazyRouteDone, loading])

  return (
    <div
      data-view-mode={viewMode === GameViewMode.Theatre ? 'theatre' : undefined}
      ref={gameFrameRef}
      className={clsx(classes.root, {
        [classes.mobile]: !isTabletOrDesktop,
        [classes.fullscreen]: viewMode === GameViewMode.FullScreen,
        [classes.theatre]: [
          GameViewMode.Theatre,
          GameViewMode.FullScreen,
        ].includes(viewMode as any),
      })}
    >
      <SlotPotatoGamepageBanner gameId={game?.id || ''} />
      <div className={classes.container} style={containerStyle}>
        <div
          ref={gameRef}
          className={classes.game}
          style={
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            {
              '--roo-game-frame-height': `${height}px`,
            } as React.CSSProperties
          }
        >
          {loading ? (
            <div className={classes.gameOverlay}>
              <CircularProgress color="secondary" />
            </div>
          ) : (
            <GameLauncherContainer
              game={game}
              errorMessage={errorMessage}
              isMobile={!isTabletOrDesktop}
              toggleRealMode={toggleRealMode}
              realMode={realMode}
              gameWrapperRef={gameWrapperRef}
              setErrorMessage={setErrorMessage}
              isBlocked={isBlocked}
            />
          )}
        </div>
        <GameRouteFooter
          isMobile={!isTabletOrDesktop}
          game={game}
          busy={loading}
          realMode={realMode}
          toggleRealMode={toggleRealMode}
          toggleFavorited={toggleFavorited}
          favorited={favorited}
          viewMode={viewMode}
          updateViewMode={updateViewMode}
        />
      </div>
    </div>
  )
}

export default GameFrameRouteView
