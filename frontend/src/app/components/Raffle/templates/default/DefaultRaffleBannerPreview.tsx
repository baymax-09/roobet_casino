/* eslint-disable i18next/no-literal-string */
import React from 'react'
import { Typography } from '@mui/material'

import { useSharedRaffleStyles } from '../shared'
import useRaffleState from '../../hooks/useRaffleState'

import { useDefaultRaffleBannerStyles } from './DefaultRaffleBanner.styles'

interface DefaultRaffleBannerPreviewProps {
  title?: string
  featuredImageSrc?: string
  backgroundImageSrc?: string
  winnerCount?: number
  start?: Date
  end?: Date
  winnersRevealed?: boolean
}

const DefaultRaffleBannerPreview = ({
  title,
  featuredImageSrc,
  backgroundImageSrc,
  winnerCount,
  winnersRevealed = false,
  start = new Date(),
  end = new Date(),
}: DefaultRaffleBannerPreviewProps) => {
  const { raffleState, stateText } = useRaffleState(start, end)
  const classes = {
    ...useDefaultRaffleBannerStyles(),
    ...useSharedRaffleStyles({
      withRibbon: true,
      bannerBackgroundImage: backgroundImageSrc,
    }),
  }

  return (
    <div className={classes.RaffleBanner}>
      {/* Banner Background Image */}
      <div className={classes.RaffleBanner__backgroundWrapper}>
        <div className={classes.RaffleBanner__background}></div>
      </div>

      <Typography
        color="deprecated.textPrimary"
        variant="h5"
        classes={{ h5: classes.RaffleBanner__title }}
      >
        {title || 'New Raffle'}
      </Typography>

      <Typography
        variant="body1"
        classes={{ body1: classes.RaffleBanner__subtitle }}
      >
        {!raffleState ? (
          'Loading...'
        ) : raffleState === 'active' ? (
          <>Winners drawn on {stateText}</>
        ) : raffleState === 'starting' ? (
          <>Raffle starts at {stateText}</>
        ) : winnersRevealed ? (
          <>Winners have been drawn</>
        ) : (
          <>Winners will be drawn soon</>
        )}
      </Typography>
    </div>
  )
}

export default DefaultRaffleBannerPreview
