import React from 'react'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { Slider, type SliderOptions, type SliderProps } from 'mrooi'
import { useTranslate } from 'app/hooks'
import { GAME_PROVIDERS } from 'app/constants'

import { ProviderThumbnail } from './ProviderThumbnail'

interface ProvidersListProps extends Omit<SliderProps, 'slides'> {}

export const useProvidersListClasses = makeStyles(() =>
  createStyles({
    ProvidersListSlide: {
      width: '203px',

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

export const ProvidersList: React.FC<ProvidersListProps> = ({ ...props }) => {
  const classes = useProvidersListClasses()
  const translate = useTranslate()
  // TODO: Not all providers have an available logo yet.
  const slides = React.useMemo(
    () =>
      Object.entries(GAME_PROVIDERS)
        .filter(([, { logo }]) => !!logo)
        .map(([key, provider]) => (
          // @ts-expect-error we are filtering on logo
          <ProviderThumbnail
            key={key}
            {...provider}
            path={`/provider/${provider.path}`}
          />
        )),
    [],
  )

  return (
    <Slider
      options={OPTIONS}
      slideClassName={classes.ProvidersListSlide}
      title={translate('homepage.providers')}
      slides={slides}
      fullPageSlide
      {...props}
    />
  )
}
