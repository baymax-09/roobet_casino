import React from 'react'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { Slider, type SliderOptions, type SliderProps } from 'mrooi'
import { useTranslate } from 'app/hooks'
import { SPORTSBOOK_ICONS_WITH_LINKS } from 'app/constants'

import { ProviderThumbnail } from '../CasinoPageRoute/ProviderThumbnail'

interface ProvidersListProps extends Omit<SliderProps, 'slides'> {}

export const useProvidersListClasses = makeStyles(() =>
  createStyles({
    SportsbookList: {
      marginBottom: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        marginBottom: uiTheme.spacing(3),
      },
    },

    ProvidersListSlide: {
      width: '203px',
      // Need to overwrite default marginRight for custom spacing in between slides
      '&:not(:last-of-type)': {
        marginRight: `${uiTheme.spacing(1)} !important`,
      },

      [uiTheme.breakpoints.up('md')]: {
        '&:not(:last-of-type)': {
          marginRight: `${uiTheme.spacing(2)} !important`,
        },
      },

      [uiTheme.breakpoints.up('lg')]: {
        width: '227px',
      },
    },
  }),
)

const OPTIONS: SliderOptions = {
  spaceBetween: 8,
  slidesPerView: 1.5,
  breakpoints: {
    [uiTheme.breakpoints.values.sm]: {
      slidesPerView: 1.5,
      spaceBetween: 8,
    },
    // Hardcoding due to large gap from "sm" to "md". 3 is needed to ensure clicking nav arrows works properly.
    670: {
      slidesPerView: 3,
      spaceBetween: 8,
    },
    [uiTheme.breakpoints.values.md]: {
      slidesPerView: 4,
      spaceBetween: 16,
    },
    [uiTheme.breakpoints.values.lg]: {
      slidesPerView: 5,
      spaceBetween: 16,
    },
  },
}

export const SportsbookList: React.FC<ProvidersListProps> = ({ ...props }) => {
  const classes = useProvidersListClasses()
  const translate = useTranslate()

  const slides = React.useMemo(
    () =>
      SPORTSBOOK_ICONS_WITH_LINKS.map(({ key, path, ...props }) => (
        <ProviderThumbnail key={key} path={`/sports${path}`} {...props} />
      )),
    [],
  )

  return (
    <Slider
      slidesClassName={classes.SportsbookList}
      slideClassName={classes.ProvidersListSlide}
      title={translate('homepage.sportsbook')}
      slides={slides}
      fullPageSlide
      options={OPTIONS}
      viewAllButtonProps={{ path: '/sports' }}
      {...props}
    />
  )
}
