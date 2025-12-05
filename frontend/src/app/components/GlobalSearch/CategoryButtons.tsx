import React from 'react'
import {
  type ActiveSVGIconType,
  Button,
  theme as uiTheme,
} from '@project-atl/ui'
import {
  Kangaroo,
  Popular,
  Slots,
  LiveCasino,
  GameShows,
  AllGames,
} from '@project-atl/ui/assets'
import { useMediaQuery } from '@mui/material'
import clsx from 'clsx'
import { useHistory, useLocation } from 'react-router'

import { useTranslate } from 'app/hooks'
import { InlineSlider } from 'mrooi'

import { useCategoryButtonStyles } from 'app/routes/CasinoPageRoute/CategoryButtons.styles'

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
export type SearchCategory =
  | 'allGames'
  | 'roobet-games'
  | 'slots'
  | 'live-casino-picks'
  | 'gameshows'
  | 'popular'

interface GameGroup {
  key: SearchCategory
  title: string
  Icon: React.FC<ActiveSVGIconType>
}

interface CategoryButtonsProps {
  selectedCategory: string
  setSelectedCategory: React.Dispatch<React.SetStateAction<SearchCategory>>
}

export const CategoryButtons: React.FC<CategoryButtonsProps> = ({
  selectedCategory,
  setSelectedCategory,
}) => {
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

  const gameGroups: GameGroup[] = React.useMemo(
    () => [
      {
        // t('gameList.allGames')
        key: 'allGames',
        title: 'gameList.allGames',
        Icon: AllGames,
      },
      {
        // t('gameList.roobetGames')
        // t('gameList.roobetGamesMobile')
        key: 'roobet-games',
        title: isTabletOrDesktop
          ? 'gameList.roobetGames'
          : 'gameList.roobetGamesMobile',
        Icon: Kangaroo,
      },
      {
        // t('gameList.slots')
        key: 'slots',
        title: 'gameList.slots',
        Icon: Slots,
      },
      {
        // t('gameList.livecasino')
        // t('gameList.livecasinoMobile')
        key: 'live-casino-picks',
        title: isTabletOrDesktop
          ? 'gameList.livecasino'
          : 'gameList.livecasinoMobile',
        Icon: LiveCasino,
      },
      {
        // t('gameList.gameShows')
        key: 'gameshows',
        title: 'gameList.gameShows',
        Icon: GameShows,
      },
      {
        // t('gameList.popular')
        // t('gameList.popularMobile')
        key: 'popular',
        title: isTabletOrDesktop
          ? 'gameList.popular'
          : 'gameList.popularMobile',
        Icon: Popular,
      },
    ],
    [isTabletOrDesktop, location],
  )

  const slides = React.useMemo(
    () =>
      gameGroups.map(({ key, title, Icon }) => () => {
        const active = key === selectedCategory

        return (
          <Button
            key={key}
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
              setSelectedCategory(key)
            }}
            label={translate(title)}
          />
        )
      }),
    [gameGroups, selectedCategory, setSelectedCategory],
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
