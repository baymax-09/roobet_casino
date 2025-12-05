import React from 'react'
import { IconButton, FormGroup } from '@mui/material'
import {
  Toggle,
  theme as uiTheme,
  Typography,
  FullScreenMode,
  OutlinedFavorite,
  TheaterMode,
} from '@project-atl/ui'

import { useApp } from 'app/context'
import Logo from 'assets/images/greyscaledLogo.svg'
import { useTranslate } from 'app/hooks'
import { type NormalizedTPGame } from 'common/types'
import { getCachedSrc } from 'common/util'

import { GameViewMode } from './useGameViewModeState'

import { useGameRouteStyles, styles } from './GameRoute.styles'

interface GameRouteFooterProps {
  isMobile: boolean
  game: NormalizedTPGame | null
  busy: boolean
  realMode: boolean
  toggleRealMode: (nextValue?: any) => void
  toggleFavorited: (() => Promise<void>) | null
  favorited: boolean | null
  viewMode: GameViewMode
  updateViewMode: (viewMode: GameViewMode) => void
}

const GameRouteFooter: React.FC<GameRouteFooterProps> = ({
  isMobile,
  game,
  busy,
  realMode,
  toggleRealMode,
  toggleFavorited,
  favorited,
  viewMode,
  updateViewMode,
}) => {
  const classes = useGameRouteStyles({
    realMode,
    favorited,
    logo: getCachedSrc({ src: Logo, width: 120, height: 34, quality: 100 }),
  })
  const translate = useTranslate()
  const { appContainer } = useApp()

  const isTheatreModeOn = viewMode === GameViewMode.Theatre

  const handleTheatreClick = () => {
    // That means we are in another mode and we are entering theatre mode.
    if (!isTheatreModeOn) {
      appContainer?.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }

    updateViewMode(GameViewMode.Theatre)
  }

  return (
    <div className={classes.footer}>
      <div className={classes.footerContainer}>
        {!busy && (
          <>
            <div className={classes.mode}>
              {!isMobile && game?.hasFunMode && (
                <FormGroup row className={classes.ToggleFormGroup}>
                  <Typography
                    variant="body4"
                    color={
                      realMode
                        ? uiTheme.palette.neutral[300]
                        : uiTheme.palette.common.white
                    }
                    fontWeight={
                      realMode
                        ? uiTheme.typography.fontWeightMedium
                        : uiTheme.typography.fontWeightBold
                    }
                  >
                    {translate('gameRoute.funMode')}
                  </Typography>
                  <Toggle
                    customTrackColor={uiTheme.palette.primary[300]}
                    checked={realMode}
                    onChange={toggleRealMode}
                  />
                  <Typography
                    variant="body4"
                    color={
                      realMode
                        ? uiTheme.palette.common.white
                        : uiTheme.palette.neutral[300]
                    }
                    fontWeight={
                      realMode
                        ? uiTheme.typography.fontWeightBold
                        : uiTheme.typography.fontWeightMedium
                    }
                  >
                    {translate('gameRoute.realMode')}
                  </Typography>
                </FormGroup>
              )}
            </div>
            <div className={classes.actions}>
              {!!toggleFavorited && (
                <IconButton
                  sx={styles.ActionsButton}
                  size="small"
                  disabled={busy}
                  onClick={toggleFavorited}
                  data-favorited={favorited}
                >
                  <OutlinedFavorite
                    iconFill={
                      favorited
                        ? uiTheme.palette.error[500]
                        : uiTheme.palette.neutral[200]
                    }
                  />
                </IconButton>
              )}
              {!isMobile && (
                <>
                  <IconButton
                    sx={styles.ActionsButton}
                    size="small"
                    onClick={handleTheatreClick}
                  >
                    <TheaterMode
                      className={classes.Icon_hover}
                      iconFill={
                        isTheatreModeOn
                          ? uiTheme.palette.primary[400]
                          : uiTheme.palette.neutral[200]
                      }
                    />
                  </IconButton>
                  <IconButton
                    sx={styles.ActionsButton}
                    size="small"
                    onClick={() => updateViewMode(GameViewMode.FullScreen)}
                  >
                    <FullScreenMode
                      className={classes.Icon_hover}
                      iconFill={uiTheme.palette.neutral[200]}
                    />
                  </IconButton>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default GameRouteFooter
