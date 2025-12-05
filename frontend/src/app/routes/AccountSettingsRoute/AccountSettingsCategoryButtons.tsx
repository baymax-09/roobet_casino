import React from 'react'
import { Link } from 'react-router-dom'
import { IconCategoryItem, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'
import { useLocation } from 'react-router'

import { useTranslate } from 'app/hooks'
import { InlineSlider } from 'mrooi'

import { accountSettingsNavButtons } from './constants/accountSettingsNavButtons'

import { useAccountSettingsCategoryButtonsStyles } from './AccountSettingsCategoryButtons.styles'

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
interface AccountSettingsCategoryButtonsProps {
  closeSearch?: () => void
  showActiveButton?: boolean
}

export const AccountSettingsCategoryButtons: React.FC<
  AccountSettingsCategoryButtonsProps
> = ({ closeSearch, showActiveButton = false }) => {
  const location = useLocation()
  const classes = useAccountSettingsCategoryButtonsStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'), {
    noSsr: true,
  })

  const currentLocation = React.useMemo(
    () => location.pathname + location.search,
    [location],
  )

  const gameGroups = React.useMemo(
    () =>
      accountSettingsNavButtons.map(({ text, activeLink, icon }) => ({
        title: translate(text),
        path: activeLink,
        Icon: icon,
        active: currentLocation === activeLink,
      })),
    [isTabletOrDesktop, currentLocation],
  )

  const slides = React.useMemo(
    () =>
      gameGroups.map(({ path, title, Icon, active }) => () => {
        const activeButton = showActiveButton && active

        return (
          <IconCategoryItem
            key={path}
            active={activeButton}
            includeCheck={false}
            size="medium"
            mobile={true}
            startIcon={
              <Icon
                className={classes.AccountSettingsCategoryButton__icon}
                active={activeButton}
                {...(!activeButton && {
                  bottomHalfFill: uiTheme.palette.neutral[400],
                  topHalfFill: uiTheme.palette.neutral[400],
                })}
              />
            }
            variant="contained"
            color="tertiary"
            component={Link}
            onClick={closeSearch}
            to={path}
            text={translate(title)}
          />
        )
      }),
    [gameGroups, closeSearch],
  )

  return (
    <div className={classes.AccountSettingsCategoryButtons}>
      <InlineSlider
        slides={slides}
        showNav={false}
        fullPageSlide
        options={SLIDER_OPTIONS}
        showGradients={!isDesktop}
        slideClassName={classes.slide}
      />
    </div>
  )
}
