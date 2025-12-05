import React from 'react'
import { Button, theme as uiTheme } from '@project-atl/ui'
import {
  Kangaroo,
  Popular,
  Slots,
  LiveCasino,
  Lobby,
  GameShows,
} from '@project-atl/ui/assets'
import { useMediaQuery } from '@mui/material'
import clsx from 'clsx'
import { useHistory, useLocation } from 'react-router'

import { useTranslate } from 'app/hooks'
import { InlineSlider } from 'mrooi'
import {
  CASINO_LIVE_CASINO_LINK,
  CASINO_LOBBY_LINK,
  CASINO_POPULAR_LINK,
  CASINO_ROOBET_GAMES_LINK,
  CASINO_SLOTS_LINK,
  CASINO_GAME_SHOWS_LINK,
} from 'app/routes/CasinoPageRoute'
import { checkIfActive, checkIfLobbyActive } from 'app/components/App/Nav/utils'

import { useCategoryButtonStyles } from './CategoryButtons.styles'

const SLIDER_OPTIONS = {
  spaceBetween: 8,
  slidesPerView: 3.5,
  breakpoints: {
    [uiTheme.breakpoints.values.sm]: {
      slidesPerView: 4.5,
      spaceBetween: 8,
    },
    [uiTheme.breakpoints.values.md]: {
      slidesPerView: 5.5,
      spaceBetween: 8,
    },
    [uiTheme.breakpoints.values.lg]: {
      slidesPerView: 8,
      spaceBetween: 8,
    },
  },
}

export const CategoryButtons: React.FC = () => {
  const location = useLocation()
  const classes = useCategoryButtonStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const history = useHistory()

  // TODO: Hacky. Slider does not work well at detecting when not to show right nav arrow. Fix the InlineSlider.
  const showGradients = useMediaQuery(() => uiTheme.breakpoints.up(985), {
    noSsr: true,
  })

  const gameGroups = React.useMemo(
    () => [
      {
        // t('gameList.lobby')
        title: 'gameList.lobby',
        path: CASINO_LOBBY_LINK,
        Icon: Lobby,
        active: checkIfLobbyActive(location),
      },
      {
        // t('gameList.roobetGames')
        // t('gameList.roobetGamesMobile')
        title: isTabletOrDesktop
          ? 'gameList.roobetGames'
          : 'gameList.roobetGamesMobile',
        path: CASINO_ROOBET_GAMES_LINK,
        Icon: Kangaroo,
        active: checkIfActive(location, CASINO_ROOBET_GAMES_LINK),
      },
      {
        // t('gameList.slots')
        title: 'gameList.slots',
        path: CASINO_SLOTS_LINK,
        Icon: Slots,
        active: checkIfActive(location, CASINO_SLOTS_LINK),
      },
      {
        // t('gameList.livecasino')
        // t('gameList.livecasinoMobile')
        title: isTabletOrDesktop
          ? 'gameList.livecasino'
          : 'gameList.livecasinoMobile',
        path: CASINO_LIVE_CASINO_LINK,
        Icon: LiveCasino,
        active: checkIfActive(location, CASINO_LIVE_CASINO_LINK),
      },
      {
        // t('gameList.gameShows')
        title: 'gameList.gameShows',
        path: CASINO_GAME_SHOWS_LINK,
        Icon: GameShows,
        active: checkIfActive(location, CASINO_GAME_SHOWS_LINK),
      },
      {
        // t('gameList.popular')
        // t('gameList.popularMobile')
        title: isTabletOrDesktop
          ? 'gameList.popular'
          : 'gameList.popularMobile',
        path: CASINO_POPULAR_LINK,
        Icon: Popular,
        active: checkIfActive(location, CASINO_POPULAR_LINK),
      },
    ],
    [isTabletOrDesktop, location],
  )

  const slides = React.useMemo(
    () =>
      gameGroups.map(({ path, title, Icon, active }) => () => {
        return (
          <Button
            key={path}
            className={clsx(classes.CategoryButton, {
              [classes.CategoryButton_active]: active,
              [classes.CategoryButton__icon_hover]: !active,
            })}
            size="medium"
            startIcon={
              <Icon
                className={classes.CategoryButton__icon}
                active={active}
                {...(!active && {
                  bottomHalfFill: uiTheme.palette.neutral[400],
                  topHalfFill: uiTheme.palette.neutral[400],
                })}
              />
            }
            variant="contained"
            color="tertiary"
            onClick={() => {
              history.push(path)
            }}
            label={translate(title)}
          />
        )
      }),
    [gameGroups],
  )

  return (
    <div className={classes.CategoryButtons}>
      <InlineSlider
        slideClassName={classes.CategoryButtons__slide}
        slides={slides}
        fullPageSlide
        options={SLIDER_OPTIONS}
        // TODO: Remove when Slider nav arrows disappear when items fit container properly.
        showNav={!showGradients}
        showGradients={!showGradients}
      />
    </div>
  )
}
