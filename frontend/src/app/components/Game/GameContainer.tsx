import React from 'react'
import clsx from 'clsx'
import { Typography, useMediaQuery, type Theme } from '@mui/material'
import { useFullscreen, useMeasure } from 'react-use'
import { theme as uiTheme } from '@project-atl/ui'

import { Balance } from 'mrooi'
import { useIsLoggedIn } from 'app/hooks'
import crash from 'assets/images/crash.png'
import GameRouteFooter from 'app/routes/GameRoute/GameRouteFooter'
import { getCachedSrc } from 'common/util'
import {
  useGameViewModeState,
  GameViewMode,
} from 'app/routes/GameRoute/useGameViewModeState'

import { useGameContainerCSSHeight } from './useGameContainerCSSHeight'

import { useGameContainerStyles } from './GameContainer.styles'

const GameContainer = ({
  title,
  rightHeaderContent = null,
  children,
  rightActions = null,
}) => {
  const isLoggedIn = useIsLoggedIn()

  const containRef = React.useRef<HTMLDivElement | null>(null)
  const { viewMode, setViewMode } = useGameViewModeState()

  const classes = useGameContainerStyles({
    flex: false,
  })
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

  const [gameRef, { height }] = useMeasure()

  useFullscreen(containRef, viewMode === GameViewMode.FullScreen, {
    onClose: () => setViewMode(GameViewMode.Regular),
  })

  const updateViewMode = newMode => {
    if (viewMode === newMode) {
      setViewMode(GameViewMode.Regular)
      return
    }

    setViewMode(newMode)
  }

  return (
    <div
      data-view-mode={viewMode === GameViewMode.Theatre ? 'theatre' : undefined}
      className={clsx({
        [classes.GameView_fullscreen]: viewMode === GameViewMode.FullScreen,
        [classes.GameView_theatre]:
          viewMode === GameViewMode.Theatre ||
          viewMode === GameViewMode.FullScreen,
      })}
    >
      <div
        ref={containRef}
        style={containerStyle}
        className={classes.GameContainer}
      >
        <div
          ref={gameRef}
          className={classes.GameView}
          style={
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            {
              '--roo-game-frame-height': `${height}px`,
            } as React.CSSProperties
          }
        >
          <div className={classes.GameHeader}>
            <div
              className={classes.GameHeader__image}
              style={{
                backgroundImage: `url(${getCachedSrc({ src: crash })}`,
              }}
            />
            <div className={classes.GameHeader__details}>
              <Typography
                className={classes.GameHeader__title}
                variant="body1"
                color="deprecated.textPrimary"
                sx={{
                  fontWeight: 'fontWeightBold',
                }}
              >
                {title}
              </Typography>
            </div>
            <div className={classes.GameHeader__contentRight}>
              {rightHeaderContent}
              {viewMode === GameViewMode.FullScreen && isLoggedIn && (
                <Balance
                  MenuProps={{
                    disablePortal: true,
                  }}
                  className={classes.GameHeader__balanceOverlay}
                  dark
                />
              )}
            </div>
          </div>

          <div
            className={clsx(classes.Game, {
              [classes.GameView_regular]: viewMode === GameViewMode.Regular,
            })}
          >
            <div className={classes.Game__sizer}>{children}</div>
          </div>

          <div className={classes.GameFooter}>
            <div className={classes.GameFooter__contentRight}>
              {rightActions}
            </div>
          </div>
        </div>
        <GameRouteFooter
          isMobile={!isTabletOrDesktop}
          // @ts-expect-error TODO: Switch when we have crash coming out of tp_games collection
          game={{ hasFunMode: false }}
          busy={false}
          realMode={true}
          // TODO: Need crash to be in tp_games collection first
          // toggleFavorited={toggleFavorited}
          // favorited={favorited}
          viewMode={viewMode}
          updateViewMode={updateViewMode}
        />
      </div>
    </div>
  )
}

export default React.memo(GameContainer)
